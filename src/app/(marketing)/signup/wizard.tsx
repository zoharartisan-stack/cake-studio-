"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  Sparkles,
  Store,
  Palette,
  UtensilsCrossed,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { StorefrontPreview } from "@/components/branding/storefront-preview";
import { ColorField } from "@/components/branding/color-field";
import { subscriptionTiers } from "@/config/site";
import { brand } from "@/config/design-tokens";
import { slugify, isValidSlug } from "@/lib/utils/slug";
import { formatCurrency } from "@/lib/utils/format";
import { MENU_CATEGORIES, DEFAULT_MENU_ITEMS } from "@/lib/onboarding/defaults";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import {
  checkSubdomain,
  createBakery,
  setBakeryLogo,
  type SubdomainResult,
} from "./actions";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

type Plan = "basic" | "premium" | "enterprise";

const STEPS = [
  { n: 1, label: "Plan", icon: Sparkles },
  { n: 2, label: "Shop", icon: Store },
  { n: 3, label: "Branding", icon: Palette },
  { n: 4, label: "Menu", icon: UtensilsCrossed },
  { n: 5, label: "Go live", icon: PartyPopper },
];

export function SignupWizard() {
  const reduce = useReducedMotionSafe();
  const supabase = useRef(createClient());

  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Plan>("premium");

  // Account + shop
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [check, setCheck] = useState<{ slug: string; result: SubdomainResult } | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  // Branding
  const [primaryColor, setPrimary] = useState<string>(brand.primary);
  const [secondaryColor, setSecondary] = useState<string>(brand.secondary);
  const [accentColor, setAccent] = useState<string>(brand.accent);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveSlug, setLiveSlug] = useState<string | null>(null);

  const slugValidFormat = isValidSlug(slug);
  const checkedForCurrent = check?.slug === slug;
  const subAvailable = Boolean(checkedForCurrent && check?.result.available);
  const checking = slug.length > 0 && slugValidFormat && !checkedForCurrent;

  // Debounced live subdomain check — network call only, no synchronous setState.
  useEffect(() => {
    if (!slug || !slugValidFormat) return;
    const t = setTimeout(async () => {
      const result = await checkSubdomain(slug);
      setCheck({ slug, result });
    }, 450);
    return () => clearTimeout(t);
  }, [slug, slugValidFormat]);

  const onLogoChange = useCallback((file: File | null) => {
    setLogoFile(file);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  async function handleAccountAndShop() {
    setError(null);
    if (name.trim().length < 2) return setError("Enter your bakery's name.");
    if (!subAvailable) return setError("Choose an available subdomain.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    try {
      if (!accountReady) {
        const { data, error: sErr } = await supabase.current.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (sErr) {
          setError(sErr.message);
          return;
        }
        if (!data.session) {
          // Project requires email confirmation — pause here until confirmed.
          setAwaitingConfirm(true);
          return;
        }
        setAccountReady(true);
      }
      setStep(3);
    } finally {
      setBusy(false);
    }
  }

  async function continueAfterConfirm() {
    setError(null);
    setBusy(true);
    try {
      const { data, error: sErr } = await supabase.current.auth.signInWithPassword({
        email,
        password,
      });
      if (sErr || !data.session) {
        setError("Not confirmed yet — click the link in your email, then try again.");
        return;
      }
      setAccountReady(true);
      setAwaitingConfirm(false);
      setStep(3);
    } finally {
      setBusy(false);
    }
  }

  async function handleLaunch() {
    setError(null);
    setBusy(true);
    try {
      const res = await createBakery({
        plan,
        name,
        slug,
        primaryColor,
        secondaryColor,
        accentColor,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Upload logo (optional) now that the bakery exists.
      if (logoFile) {
        const ext = (logoFile.name.split(".").pop() ?? "png").toLowerCase();
        const path = `${res.bakeryId}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.current.storage
          .from("bakery-logos")
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (!upErr) {
          const { data } = supabase.current.storage
            .from("bakery-logos")
            .getPublicUrl(path);
          await setBakeryLogo(data.publicUrl);
        }
      }
      setLiveSlug(res.slug);
      setStep(5);
    } finally {
      setBusy(false);
    }
  }

  const preview = { name, logoUrl: logoPreview, primaryColor, secondaryColor, accentColor };

  return (
    <Container className="py-10">
      {/* Stepper */}
      <ol className="mx-auto mb-10 flex max-w-2xl items-center justify-between">
        {STEPS.map((s, i) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <li key={s.n} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-colors ${
                    done
                      ? "border-gold-500 bg-gold-500 text-white"
                      : active
                        ? "border-gold-500 text-gold-700"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </span>
                <span className={`text-xs ${active ? "text-choco-800" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 ${done ? "bg-gold-500" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* STEP 1 — PLAN */}
          {step === 1 && (
            <section className="mx-auto max-w-4xl">
              <h1 className="text-center text-3xl">Choose your plan</h1>
              <p className="mt-2 text-center text-muted-foreground">
                Pick the plan that fits your bakery. You can change this anytime — billing comes later.
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {subscriptionTiers.map((tier) => {
                  const selected = plan === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setPlan(tier.id as Plan)}
                      className={`rounded-xl border-2 bg-surface p-6 text-left transition-all ${
                        selected ? "border-gold-500 shadow-lift" : "border-border hover:border-gold-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl">{tier.name}</h3>
                        {selected && <Check className="h-5 w-5 text-gold-600" />}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
                      <ul className="mt-4 space-y-1.5 text-sm text-choco-600">
                        {tier.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-end">
                <Button size="lg" onClick={() => setStep(2)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          )}

          {/* STEP 2 — ACCOUNT & SHOP */}
          {step === 2 && (
            <section className="mx-auto max-w-lg">
              <h1 className="text-center text-3xl">Create your bakery</h1>
              <p className="mt-2 text-center text-muted-foreground">
                Your owner account and shop address.
              </p>
              {awaitingConfirm ? (
                <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-center">
                  <h2 className="text-xl">Confirm your email</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We sent a confirmation link to{" "}
                    <span className="font-medium text-choco-700">{email}</span>. Click it, then
                    continue setting up your bakery.
                  </p>
                  {error && <p className="mt-3 text-sm text-danger">{error}</p>}
                  <div className="mt-5 flex justify-center gap-3">
                    <Button variant="ghost" onClick={() => setAwaitingConfirm(false)} disabled={busy}>
                      Back
                    </Button>
                    <Button onClick={continueAfterConfirm} disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      I&apos;ve confirmed — continue
                    </Button>
                  </div>
                </div>
              ) : (
              <>
              <div className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="name">Bakery name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      if (!slugTouched) setSlug(slugify(val));
                    }}
                    placeholder="Sweet Layers"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(slugify(e.target.value));
                      }}
                      placeholder="sweet-layers"
                      className="flex-1"
                    />
                    <span className="whitespace-nowrap text-sm text-muted-foreground">.{ROOT_DOMAIN}</span>
                  </div>
                  <p className="mt-1.5 h-4 text-xs">
                    {slug.length > 0 && !slugValidFormat && (
                      <span className="text-danger">3–40 chars: letters, numbers, hyphens.</span>
                    )}
                    {slugValidFormat && checking && (
                      <span className="text-muted-foreground">Checking…</span>
                    )}
                    {slugValidFormat && checkedForCurrent && check?.result.available && (
                      <span className="text-success">✓ {slug}.{ROOT_DOMAIN} is available</span>
                    )}
                    {slugValidFormat && checkedForCurrent && check && !check.result.available && (
                      <span className="text-danger">{check.result.reason}</span>
                    )}
                  </p>
                </div>
                <hr className="border-border" />
                <div>
                  <Label htmlFor="email">Your email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@bakery.com" autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
                </div>
              </div>
              {error && <p className="mt-4 text-sm text-danger">{error}</p>}
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handleAccountAndShop} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Continue
                </Button>
              </div>
              </>
              )}
            </section>
          )}

          {/* STEP 3 — BRANDING */}
          {step === 3 && (
            <section className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              <div>
                <h1 className="text-3xl">Make it yours</h1>
                <p className="mt-2 text-muted-foreground">
                  Pick your colors and logo. The preview updates as you go.
                </p>
                <div className="mt-6 space-y-5">
                  <ColorField label="Primary" value={primaryColor} onChange={setPrimary} />
                  <ColorField label="Secondary" value={secondaryColor} onChange={setSecondary} />
                  <ColorField label="Accent" value={accentColor} onChange={setAccent} />
                  <div>
                    <Label>Logo (optional)</Label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-choco-600 hover:border-gold-400">
                      <Upload className="h-4 w-4" />
                      {logoFile ? logoFile.name : "Upload a logo (PNG, JPG, SVG)"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-8 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="md:pt-14">
                <StorefrontPreview {...preview} />
              </div>
            </section>
          )}

          {/* STEP 4 — MENU BASICS */}
          {step === 4 && (
            <section className="mx-auto max-w-3xl">
              <h1 className="text-center text-3xl">A menu to start from</h1>
              <p className="mt-2 text-center text-muted-foreground">
                We&apos;ll pre-fill these builder options and prices so you&apos;re not starting blank.
                Edit everything later in your dashboard.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {MENU_CATEGORIES.map((cat) => {
                  const items = DEFAULT_MENU_ITEMS.filter((m) => m.category === cat.key);
                  return (
                    <div key={cat.key} className="rounded-xl border border-border bg-surface p-4">
                      <h3 className="text-base">{cat.label}</h3>
                      <ul className="mt-2 space-y-1 text-sm text-choco-600">
                        {items.map((m) => (
                          <li key={m.name} className="flex justify-between">
                            <span>{m.name}</span>
                            <span className="text-muted-foreground">
                              {m.price_minor === 0 ? "included" : `+${formatCurrency(m.price_minor)}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)} disabled={busy}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button size="lg" onClick={handleLaunch} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
                  Launch my storefront
                </Button>
              </div>
            </section>
          )}

          {/* STEP 5 — GO LIVE */}
          {step === 5 && liveSlug && (
            <section className="mx-auto max-w-lg text-center">
              <motion.div
                initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 16 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-100 text-gold-600"
              >
                <PartyPopper className="h-10 w-10" />
              </motion.div>
              <h1 className="mt-6 text-3xl">You&apos;re live! 🎉</h1>
              <p className="mt-2 text-muted-foreground">
                {name} now has its own branded storefront.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-surface p-5">
                <p className="text-sm text-muted-foreground">Your storefront URL</p>
                <p className="mt-1 font-display text-lg text-gold-700">
                  {liveSlug}.{ROOT_DOMAIN}
                </p>
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/dashboard">
                  <Button size="lg">Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </Container>
  );
}
