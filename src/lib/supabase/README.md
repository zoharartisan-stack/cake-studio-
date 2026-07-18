# lib/supabase

Supabase integration for CakeCraft Studio.

## Clients

| File        | Key           | RLS      | Use from                              |
| ----------- | ------------- | -------- | ------------------------------------- |
| `client.ts` | anon          | enforced | Client Components                     |
| `server.ts` | anon          | enforced | Server Components, Route Handlers, Server Actions |
| `admin.ts`  | service role  | **BYPASSED** | Trusted server-only work (Stripe webhooks, platform admin). `server-only` guarded. |

Tenant resolution lives in `../tenant/` and is wired up in `src/proxy.ts`.

## Auth configuration (Supabase dashboard)

Roles are `platform_admin`, `bakery_owner`, `bakery_staff`, `end_customer`
(enum `public.user_role`). A DB trigger (`handle_new_user`) auto-creates a
`public.users` profile row on every signup — for **both** email/password and
Google OAuth. Per-bakery access comes from the `bakery_staff` and
`end_customer_profiles` membership tables (end-customer accounts are
tenant-scoped). A trigger (`prevent_role_escalation`) blocks non-admins from
changing their own `role`.

To finish enabling auth (Authentication → Providers / URL config):

1. **Email/password** — enabled by default. Decide on email confirmations.
2. **Google OAuth** — enable the Google provider and paste the OAuth
   **Client ID** and **Client Secret** from Google Cloud Console. Add the
   Supabase callback URL (`https://ajjqpryhjjwrttexhevp.supabase.co/auth/v1/callback`)
   as an authorized redirect URI in Google.
3. **Redirect URLs** — add the site URL and, for multi-tenant subdomains, the
   wildcard redirect (`http://localhost:3000/**` for dev; `https://*.<root-domain>/**`
   and each custom domain for prod) so post-login redirects back to the right
   storefront are allowed.

No secrets belong in code — the anon/publishable key is browser-safe; the
service-role key and OAuth secrets live in env / the dashboard only.
