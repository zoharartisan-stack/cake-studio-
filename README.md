# Cake Craft — Shopify Online Store 2.0 Theme

A modern, premium, fully responsive Shopify theme for **Cake Craft**, a custom
cake studio. Customers design their own cakes through an elegant, app-like,
step-by-step builder with a **live preview** and **instant pricing**.

![Cake Craft](https://img.shields.io/badge/Shopify-OS%202.0-A22A4E)

---

## ✨ Features

- **8-step cake builder** — Occasion → Size → Shape → Flavor → Design → Message & Extras → Delivery → Review
- **Live SVG cake preview** that updates instantly (shape, flavor color, message, decorations, size)
- **Instant pricing engine** — price updates the moment any option changes, with a full breakdown at review
- **Interactive 3D hero cake** — rotating turntable + frosting color changes on hover/tap
- **Ready-made design gallery** — 8 professional templates, one-tap "customize this"
- **Upload your own** cake inspiration image (auto-resized, shown live in the preview)
- **Shopify-style checkout** that emails the full custom order to the store (via the built-in contact form — no product setup or apps required)
- **Fully responsive** — phones, tablets, laptops, desktops, ultra-wide; hamburger menu on mobile, full nav on desktop
- **Premium micro-interactions** — smooth step transitions, hover effects, loading animation, scroll reveals
- Works in **Chrome, Safari, Edge, Firefox, Opera**

### Color palette
| Token | Value |
|-------|-------|
| Primary | `#A22A4E` |
| Background | `#FFE4D6` |
| Headings | `#000000` |
| Cards | `#FFFFFF` (soft shadows) |

All colors are editable in **Theme editor → Theme settings → Colors**.

---

## 🚀 Installation

### Option A — Upload the ZIP (recommended)
1. In your repo, download **`cake-craft-theme.zip`**.
2. In Shopify Admin go to **Online Store → Themes**.
3. Click **Add theme → Upload zip file** and select `cake-craft-theme.zip`.
4. Click **Customize** to preview, then **Publish** when ready.

The homepage works **immediately** after upload — the full cake builder and
checkout are built into the home page, so there is nothing else to configure.

### Option B — Build the ZIP yourself
```bash
# from the repo root
zip -r cake-craft-theme.zip assets config layout locales sections snippets templates
```

---

## 🧭 Navigation & pages (zero-config by design)

The header/footer links point to real pages **if they exist**, and otherwise
fall back to the matching section on the home page — so the menu works out of
the box:

| Menu item | Works immediately as | Optional dedicated page |
|-----------|----------------------|--------------------------|
| Home | `/` | — |
| Make Your Own Cake | `/#builder` (home) | create page `make-your-own-cake` |
| Ready Designs | `/#ready-designs` (home) | create page `ready-designs` |
| Help | expands in the menu (email + phone) | create page `help` |

**To use clean dedicated pages (optional):** in Shopify Admin → **Online Store →
Pages → Add page**, create pages with these handles and assign the matching
template from the “Theme template” dropdown:

| Page title | Handle | Template |
|------------|--------|----------|
| Make Your Own Cake | `make-your-own-cake` | `make-your-own-cake` |
| Ready Designs | `ready-designs` | `ready-designs` |
| Help | `help` | `help` |
| Checkout | `checkout` | `checkout` |

Once created, the menu automatically switches to the dedicated pages.

---

## 🛒 How orders are captured

The custom cake is not a standard variant product, so the “Place Order” form
uses Shopify’s built-in **contact form**. When a customer places an order:

- The full cake specification (occasion, size, shape, flavor, design, message,
  extras, delivery, and a complete price breakdown) is submitted.
- Shopify emails it to your store’s **customer email**
  (Settings → Store details → Contact email / Sender email).

This means the theme works with **no products, apps, or code** to set up. If you
later want real payments, you can connect the builder to a Shopify product or a
draft-order app — the order payload is already assembled in
`assets/cake-builder.js` (`orderPayload()`).

---

## 🎨 Customization

Everything is editable from the **Theme editor** (no code needed):

- **Colors, fonts, contact email/phone** — Theme settings
- **Hero text & button**, **features**, **how-it-works steps**, **FAQs** — each section’s settings
- **Header logo** — Header section → Logo image (falls back to the text logo)

### Pricing
Prices live in the option markup in `sections/cake-builder.liquid`
(`data-price` attributes) and in `assets/cake-builder.js` (design/message
surcharges). Update those values to change pricing. Currency label is `Rs`
(edit `CUR` in `cake-builder.js`).

---

## 📁 Project structure

```
assets/
  base.css            # full design system + responsive layout + animations
  theme.js            # header, drawer, nav dropdowns, scroll reveal, 3D cake
  cake-builder.js     # step wizard, live preview, pricing, checkout
config/
  settings_schema.json / settings_data.json
layout/
  theme.liquid / password.liquid
locales/
  en.default.json
sections/
  header, footer, hero, features, how-it-works, cake-builder, checkout,
  ready-designs, designs-preview, help, cta-banner, main-* (standard pages)
snippets/
  icon, nav-url, hero-cake, cake-template
templates/
  index.json, page.*.json (builder/ready/help/checkout), + all standard
  Shopify templates and customer templates
```

---

## 📞 Support contact (default)
- Email: **cakecraftstudio@gmail.com**
- Phone: **+92 371 0756370**

(Editable in Theme settings and section settings.)
