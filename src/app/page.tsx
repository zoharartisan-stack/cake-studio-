import type { Metadata } from "next";
import Link from "next/link";
import { Cake, Palette, Store, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { siteConfig, subscriptionTiers } from "@/config/site";

export const metadata: Metadata = {
  title: "Launch your branded cake-design storefront",
};

const features = [
  {
    icon: Store,
    title: "Your brand, your storefront",
    body: "A fully branded website with your logo, colors, menu, and domain. Your customers never see anyone else's bakery.",
  },
  {
    icon: Cake,
    title: "16-step Cake Builder",
    body: "Customers design cakes step by step, with prices pulled from your own configured menu — every choice priced server-side.",
  },
  {
    icon: Palette,
    title: "Playful & animated",
    body: "Drag-and-drop decorations, a live cake preview, and celebratory moments make ordering feel like a game.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] opacity-70 motion-safe:animate-[float_10s_ease-in-out_infinite]"
          style={{
            backgroundImage: "url(/backgrounds/hero-blob.svg)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
        />
        <Container className="relative py-24 sm:py-32">
          <Reveal>
            <Badge tone="rose" className="mb-5">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              White-label bakery SaaS
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="max-w-3xl text-5xl leading-tight sm:text-6xl">
              {siteConfig.tagline}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {siteConfig.description}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/signup">
                <Button size="lg">Start your bakery</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <Card className="h-full">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <CardTitle className="mt-4">{f.title}</CardTitle>
                  <CardDescription>{f.body}</CardDescription>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl">Plans for every bakery</h2>
              <p className="mt-3 text-muted-foreground">
                Subscribe as a bakery owner and get your own branded storefront.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {subscriptionTiers.map((tier, i) => (
              <Reveal key={tier.id} delay={i * 0.08}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <CardTitle>{tier.name}</CardTitle>
                    {tier.id === "premium" && (
                      <Badge tone="gold">Popular</Badge>
                    )}
                  </div>
                  <CardDescription>{tier.blurb}</CardDescription>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-choco-600">
                    {tier.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-6 block">
                    <Button
                      variant={tier.id === "premium" ? "primary" : "outline"}
                      className="w-full"
                    >
                      Choose {tier.name}
                    </Button>
                  </Link>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <footer className="border-t border-border py-10">
        <Container className="text-sm text-muted-foreground">
          © {siteConfig.name}. Foundation build — design system preview.
        </Container>
      </footer>
    </main>
  );
}
