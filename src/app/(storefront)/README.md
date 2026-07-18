# (storefront) route group

The per-bakery, customer-facing storefront (resolved by subdomain / custom
domain). Home, occasion library, the 16-step Cake Builder, cart, checkout
(Stripe cards + Cash-on-Delivery), and order tracking. Every query is
tenant-scoped by `bakery_id` via RLS. Built after Phase 2.
