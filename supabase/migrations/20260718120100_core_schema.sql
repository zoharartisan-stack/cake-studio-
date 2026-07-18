-- =============================================================================
-- Phase 2 · Migration 2 — Core multi-tenant schema
-- -----------------------------------------------------------------------------
-- White-label, multi-tenant bakery SaaS. `bakeries` is the tenant root; every
-- tenant-owned table carries `bakery_id` (the column RLS filters on). Money is
-- stored in integer MINOR units (paisa/cents) to avoid float drift; all totals
-- are computed server-side, never trusted from the client.
-- =============================================================================

-- ----- Enums -----------------------------------------------------------------
create type public.user_role as enum (
  'platform_admin', 'bakery_owner', 'bakery_staff', 'end_customer'
);
create type public.staff_role as enum ('bakery_owner', 'bakery_staff');
create type public.bakery_status as enum ('pending', 'active', 'suspended', 'cancelled');
create type public.subscription_tier as enum ('basic', 'premium', 'enterprise');
create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'
);
create type public.order_status as enum (
  'pending', 'confirmed', 'in_production', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'
);
create type public.payment_method as enum ('stripe_card', 'cash_on_delivery');
create type public.payment_status as enum (
  'unpaid', 'pending', 'paid', 'refunded', 'partially_refunded', 'failed'
);
create type public.fulfillment_type as enum ('delivery', 'pickup');
create type public.invoice_status as enum ('draft', 'issued', 'paid', 'void');

-- ----- Generic updated_at trigger fn -----------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Identity & tenancy
-- ============================================================================

-- users — 1:1 profile mirror of auth.users. Global (not tenant-owned).
-- `role` is the coarse account role; per-bakery access comes from the
-- bakery_staff / end_customer_profiles membership tables.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role public.user_role not null default 'end_customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- bakeries — the TENANT ROOT. Resolved by subdomain (slug) or custom_domain.
create table public.bakeries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  custom_domain text unique,
  status public.bakery_status not null default 'pending',
  description text,
  logo_url text,
  -- Per-tenant branding (overrides the design-system defaults at runtime).
  primary_color text not null default '#D4AF37',
  secondary_color text not null default '#E89AAE',
  accent_color text not null default '#3A2A1F',
  -- Market-agnostic locale/delivery settings (Pakistan/South-Asia defaults).
  currency text not null default 'PKR',
  locale text not null default 'en-PK',
  city text,
  region text,
  country text default 'PK',
  contact_email text,
  contact_phone text,
  whatsapp text,
  cod_enabled boolean not null default true,
  card_payments_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bakeries_owner_id_idx on public.bakeries (owner_id);
create index bakeries_status_idx on public.bakeries (status);

-- bakery_staff — which users work for which bakery (owner or staff).
-- Linchpin for RLS: "is the current user a member of bakery X?"
create table public.bakery_staff (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.staff_role not null default 'bakery_staff',
  created_at timestamptz not null default now(),
  unique (bakery_id, user_id)
);
create index bakery_staff_bakery_id_idx on public.bakery_staff (bakery_id);
create index bakery_staff_user_id_idx on public.bakery_staff (user_id);

-- end_customer_profiles — a customer account SCOPED TO ONE BAKERY. The same
-- auth user may be a customer of several bakeries (one profile per bakery),
-- but each profile — and all its data — belongs to exactly one tenant.
create table public.end_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null default '',
  phone text,
  default_address jsonb,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bakery_id, user_id)
);
create index end_customer_profiles_bakery_id_idx on public.end_customer_profiles (bakery_id);
create index end_customer_profiles_user_id_idx on public.end_customer_profiles (user_id);

-- ============================================================================
-- Occasions (global library + per-bakery selection)
-- ============================================================================

-- occasion_library — GLOBAL, platform-curated list (not tenant-owned).
create table public.occasion_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  default_enabled boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- bakery_occasions — which library occasions a bakery enabled, plus its own
-- custom occasions.
create table public.bakery_occasions (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  occasion_id uuid references public.occasion_library(id) on delete cascade,
  custom_name text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (occasion_id is not null or custom_name is not null)
);
create index bakery_occasions_bakery_id_idx on public.bakery_occasions (bakery_id);
create unique index bakery_occasions_unique_library
  on public.bakery_occasions (bakery_id, occasion_id) where occasion_id is not null;

-- ============================================================================
-- Menu, templates & customer designs
-- ============================================================================

-- menu_items — the bakery's configured Cake Builder options and prices
-- (sizes, flavors, fillings, frostings, toppings, shapes, decorations, …).
-- `category` maps to a builder step; prices come from HERE, server-side.
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  category text not null,
  name text not null,
  description text,
  price_minor integer not null default 0 check (price_minor >= 0),
  is_base_price boolean not null default false,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_bakery_id_idx on public.menu_items (bakery_id);
create index menu_items_bakery_category_idx on public.menu_items (bakery_id, category);

-- cake_templates — pre-designed cakes a bakery offers as builder starting points.
create table public.cake_templates (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  occasion_id uuid references public.occasion_library(id) on delete set null,
  name text not null,
  description text,
  base_price_minor integer not null default 0 check (base_price_minor >= 0),
  image_url text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cake_templates_bakery_id_idx on public.cake_templates (bakery_id);

-- cake_designs — a specific design produced by the 16-step builder.
-- `computed_price_minor` is a server-computed snapshot (never client-trusted).
create table public.cake_designs (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  end_customer_id uuid references public.end_customer_profiles(id) on delete set null,
  template_id uuid references public.cake_templates(id) on delete set null,
  name text not null default 'My Cake',
  config jsonb not null default '{}'::jsonb,
  preview_image_url text,
  ai_prompt text,
  ai_image_url text,
  computed_price_minor integer not null default 0 check (computed_price_minor >= 0),
  is_saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cake_designs_bakery_id_idx on public.cake_designs (bakery_id);
create index cake_designs_end_customer_id_idx on public.cake_designs (end_customer_id);

-- ============================================================================
-- Orders, history & messaging
-- ============================================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  end_customer_id uuid references public.end_customer_profiles(id) on delete set null,
  cake_design_id uuid references public.cake_designs(id) on delete set null,
  order_number text not null,
  status public.order_status not null default 'pending',
  fulfillment_type public.fulfillment_type not null default 'delivery',
  delivery_address jsonb,
  delivery_date date,
  delivery_slot text,
  -- Server-computed money (minor units).
  subtotal_minor integer not null default 0 check (subtotal_minor >= 0),
  delivery_fee_minor integer not null default 0 check (delivery_fee_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  total_minor integer not null default 0 check (total_minor >= 0),
  currency text not null default 'PKR',
  payment_method public.payment_method not null default 'cash_on_delivery',
  payment_status public.payment_status not null default 'unpaid',
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bakery_id, order_number)
);
create index orders_bakery_id_idx on public.orders (bakery_id);
create index orders_end_customer_id_idx on public.orders (end_customer_id);
create index orders_bakery_status_idx on public.orders (bakery_id, status);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  changed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history (order_id);
create index order_status_history_bakery_id_idx on public.order_status_history (bakery_id);

-- messages — customer <-> bakery conversation, optionally tied to an order.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  sender_role public.user_role,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_bakery_id_idx on public.messages (bakery_id);
create index messages_order_id_idx on public.messages (order_id);

-- ============================================================================
-- Customer engagement & billing
-- ============================================================================

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  end_customer_id uuid not null references public.end_customer_profiles(id) on delete cascade,
  cake_template_id uuid references public.cake_templates(id) on delete cascade,
  cake_design_id uuid references public.cake_designs(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (cake_template_id is not null or cake_design_id is not null)
);
create index favorites_bakery_id_idx on public.favorites (bakery_id);
create index favorites_end_customer_id_idx on public.favorites (end_customer_id);
create unique index favorites_customer_template_uidx
  on public.favorites (end_customer_id, cake_template_id) where cake_template_id is not null;
create unique index favorites_customer_design_uidx
  on public.favorites (end_customer_id, cake_design_id) where cake_design_id is not null;

-- invoices — end-customer order invoices.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  end_customer_id uuid references public.end_customer_profiles(id) on delete set null,
  invoice_number text not null,
  amount_minor integer not null default 0 check (amount_minor >= 0),
  currency text not null default 'PKR',
  status public.invoice_status not null default 'draft',
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bakery_id, invoice_number)
);
create index invoices_bakery_id_idx on public.invoices (bakery_id);
create index invoices_order_id_idx on public.invoices (order_id);

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  end_customer_id uuid not null references public.end_customer_profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  points integer not null,           -- positive = earned, negative = redeemed
  reason text,
  created_at timestamptz not null default now()
);
create index loyalty_transactions_bakery_id_idx on public.loyalty_transactions (bakery_id);
create index loyalty_transactions_end_customer_id_idx on public.loyalty_transactions (end_customer_id);

-- bakery_subscriptions — the bakery's SaaS subscription (platform revenue).
-- Written mainly by Stripe webhooks (service role); bakeries read their own.
create table public.bakery_subscriptions (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null unique references public.bakeries(id) on delete cascade,
  tier public.subscription_tier not null default 'basic',
  status public.subscription_status not null default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bakery_subscriptions_bakery_id_idx on public.bakery_subscriptions (bakery_id);

-- ----- updated_at triggers ---------------------------------------------------
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bakeries
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.end_customer_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cake_templates
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cake_designs
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bakery_subscriptions
  for each row execute function public.set_updated_at();
