/** Turn arbitrary text into a valid bakery subdomain slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Matches the DB slug CHECK constraint on public.bakeries.slug. */
export const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 40 && SLUG_PATTERN.test(slug);
}

/** Reserved subdomains that must not be claimed by a bakery. */
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "signup",
  "login",
  "auth",
  "static",
  "assets",
  "cdn",
  "mail",
  "support",
  "help",
  "status",
  "blog",
]);
