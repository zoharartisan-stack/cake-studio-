"use client";

import { useState } from "react";
import { Loader2, Upload, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { StorefrontPreview } from "@/components/branding/storefront-preview";
import { ColorField } from "@/components/branding/color-field";
import { slugify } from "@/lib/utils/slug";
import type { Database } from "@/types/database.types";
import { updateBranding, updateSubdomain } from "../actions";

type Bakery = Database["public"]["Tables"]["bakeries"]["Row"];

export function BrandingPanel({
  bakery,
  rootDomain,
}: {
  bakery: Bakery;
  rootDomain: string;
}) {
  const [name, setName] = useState(bakery.name);
  const [description, setDescription] = useState(bakery.description ?? "");
  const [primaryColor, setPrimary] = useState(bakery.primary_color);
  const [secondaryColor, setSecondary] = useState(bakery.secondary_color);
  const [accentColor, setAccent] = useState(bakery.accent_color);
  const [logoUrl, setLogoUrl] = useState<string | null>(bakery.logo_url);
  const [logoBusy, setLogoBusy] = useState(false);

  const [slug, setSlug] = useState(bakery.slug);
  const [saving, setSaving] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [slugMsg, setSlugMsg] = useState<string | null>(null);

  async function handleLogo(file: File | null) {
    if (!file) return;
    setLogoBusy(true);
    setErr(null);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${bakery.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("bakery-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setErr(error.message);
        return;
      }
      const { data } = supabase.storage.from("bakery-logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    const res = await updateBranding({
      name,
      description,
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl,
    });
    setSaving(false);
    if (res.ok) setMsg("Branding saved.");
    else setErr(res.error);
  }

  async function handleSlug() {
    setSlugSaving(true);
    setSlugMsg(null);
    const res = await updateSubdomain(slug);
    setSlugSaving(false);
    setSlugMsg(res.ok ? "Subdomain updated." : res.error);
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">Branding</h1>
      <p className="mt-1 text-muted-foreground">
        Update your logo, colors, and subdomain. Changes go live on your storefront.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardTitle>Identity</CardTitle>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="name">Bakery name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="desc">Tagline / description</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fresh custom cakes, baked daily" />
              </div>
              <div>
                <Label>Logo</Label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-choco-600 hover:border-gold-400">
                  {logoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {logoUrl ? "Replace logo" : "Upload a logo (PNG, JPG, SVG)"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Colors</CardTitle>
            <div className="mt-4 space-y-4">
              <ColorField label="Primary" value={primaryColor} onChange={setPrimary} />
              <ColorField label="Secondary" value={secondaryColor} onChange={setSecondary} />
              <ColorField label="Accent" value={accentColor} onChange={setAccent} />
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save branding
            </Button>
            {msg && <span className="text-sm text-success">{msg}</span>}
            {err && <span className="text-sm text-danger">{err}</span>}
          </div>

          <Card>
            <CardTitle>Subdomain</CardTitle>
            <CardDescription>Your storefront web address.</CardDescription>
            <div className="mt-4 flex items-center gap-2">
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="flex-1" />
              <span className="whitespace-nowrap text-sm text-muted-foreground">.{rootDomain}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button variant="outline" onClick={handleSlug} disabled={slugSaving || slug === bakery.slug}>
                {slugSaving && <Loader2 className="h-4 w-4 animate-spin" />} Update subdomain
              </Button>
              {slugMsg && <span className="text-sm text-choco-600">{slugMsg}</span>}
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-3 text-sm font-medium text-choco-700">Live preview</p>
          <StorefrontPreview
            name={name}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
}
