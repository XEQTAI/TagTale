# TagTale Landing Page — Design Brief & AI Prompt

> **Purpose:** This document is a living prompt to generate and iterate the TagTale marketing landing page.
> The app is monochrome; the landing page is the opposite — bold, colourful, and inviting.

---

## Prompt (for AI code generation / design tools)

```
Build a marketing landing page for TagTale — a social platform where physical objects
accumulate stories as they travel between people.

─── BRAND ──────────────────────────────────────────────────────────────────────
- Name: TagTale  (word-mark only — no icon/logo graphic)
- Wordmark: "Tag" in light weight + "Tale" in bold, same typeface, no gap
- Tagline: "Every object has a story."
- Sub-tagline: "Scan. Post. Follow the journey."
- Font: Inter or similar geometric sans-serif
- Tone: warm, curious, slightly poetic — not corporate, not techy

─── COLOUR PALETTE ─────────────────────────────────────────────────────────────
The landing page is DELIBERATELY colourful — a contrast to the clean monochrome app.
Use a vibrant, modern palette:

  Primary:    #1A1A1A  (near-black — text, headers)
  Canvas:     #FAFAFA  (off-white — light mode base)
  Accent 1:   #FF5C35  (vivid orange-red — primary CTAs, highlights)
  Accent 2:   #2563EB  (electric blue — secondary elements)
  Accent 3:   #7C3AED  (violet — gradient use, scan glow)
  Accent 4:   #059669  (green — success states, "scanned" moments)
  Gradient:   linear-gradient(135deg, #FF5C35 0%, #7C3AED 100%)

Dark mode equivalents:
  Primary:    #F0F0F0
  Canvas:     #0A0A0A
  Cards:      #161616
  Never show white text on white bg or black text on black bg.

─── SECTIONS (in order) ────────────────────────────────────────────────────────

### 1. HERO
- Full-width, bold typography
- Headline (large, 72–96px on desktop): "Every object has a story."
- Sub: "Scan the QR code. Share your moment. Follow where it goes next."
- Primary CTA button: "Get started free" → /login  (Accent 1 colour, large, rounded)
- Secondary link: "See how it works" → scrolls to #how-it-works
- Hero visual: an animated or illustrated path showing an object (lighter, backpack,
  garden gnome) passing through different hands with speech bubbles / posts appearing.
  Use SVG illustration — no emoji, no stock photos.
- Subtle animated gradient background (very slow, not distracting)
- Dark/light mode toggle in top-right of nav

### 2. USE CASES  (id="use-cases")
Six use-case cards in a 2×3 or 3×2 grid. Each card:
  - SVG icon (monoline, clean) — NOT emoji
  - Title (bold)
  - 2-sentence description
  - Hover: card lifts with colour accent border

Use cases:
  1. "The Travelling Lighter"
     Icon: flame / lighter SVG
     "Attach a QR code to your lighter. Watch the stories pile up as it changes hands
      at parties, campsites, and concerts across the world."

  2. "Road Trip Memories"
     Icon: steering wheel / car
     "Stick a tag on your dashboard. Every passenger, city, and breakdown becomes part
      of your car's permanent story — scanned at every stop."

  3. "The Hat That's Seen Everything"
     Icon: hat / cap
     "Pass your favourite hat to a friend. Each person who wears it adds a photo.
      Years from now, you'll have a portrait gallery of everyone who's ever worn it."

  4. "Lend With Confidence"
     Icon: exchange arrows / hands
     "Lending a book, a tool, a bike? Tag it. The borrower scans it, posts about it,
      and you follow along. No more 'who has my drill?'"

  5. "Farm to Table"
     Icon: plant / leaf
     "Tag a crate of vegetables at the farm. Consumers scan the QR at the market and
      see who grew it, when it was picked, and the journey it took."

  6. "Collector's Archive"
     Icon: star / gem
     "Tag rare cards, vintage items, or art pieces. Build a verified provenance trail
      that travels with the object — forever."

### 3. HOW IT WORKS  (id="how-it-works")
Three-step horizontal flow with connecting lines:

  Step 1 — "Print a QR tag"
  SVG: QR code with small print icon
  "Generate a QR code for any object. Print a branded card with one tap."

  Step 2 — "Scan & post"
  SVG: phone scanning QR
  "Scan the code with any phone camera. Sign in with your email and share
   your moment — photo, video, or just words."

  Step 3 — "Follow the journey"
  SVG: map with dots / path
  "Everyone who has ever scanned the object can see the full story.
   Follow updates as the object travels."

Visual: horizontal timeline with numbered steps connected by a dotted line.
Mobile: vertical stack.
Background: light gray (light mode), near-black (dark mode).

### 4. THE APP PREVIEW
Split layout:
- Left: phone mockup showing the TagTale feed UI (black & white screenshot or SVG mockup)
  — shows monochrome app design with colourful photos in feed
- Right: copy
  "Beautiful by design. Monochrome UI keeps the focus on your photos and stories —
   colour lives in the memories, not the interface."
  + list of features with SVG checkmark icons:
    ✓ Magic link sign-in — no password ever
    ✓ 1-hour post window after each scan
    ✓ Private feeds — only scanners can see
    ✓ GPS scan map — follow the physical journey
    ✓ AI content moderation — always safe
    ✓ Printable QR cards with sponsor branding

### 5. SPONSOR / BRAND SECTION
- Headline: "Turn your product into a story."
- Sub: "Sponsor objects at scale. 100 lighters, 500 notebooks, a product launch —
        every scan is a touchpoint. Every post is organic content."
- Three stat boxes (animated counter on scroll):
    "1 QR code" → "∞ stories"
    "0 cost per scan" → "real engagement"
    "Every object" → "tracked forever"
- CTA: "Contact us about sponsorship" → mailto or form

### 6. TESTIMONIALS / USE CASE QUOTES  (optional)
3 fictional but realistic quotes from different user types:
  "Stuck a tag on my backpack before a gap year. 47 stories later,
   it's the best travel diary I never wrote." — Alex, London
  "Our produce tags have helped us build real trust with customers.
   They scan, they see the farm, they come back." — Maria, farmer
  "The hat has been to 12 countries now. I check it every week." — Daniel, Berlin

### 7. FINAL CTA
- Dark background (inverted from hero)
- Large headline: "Start your first story."
- Sub: "Free to use. No credit card. Just scan."
- Button: "Create your first tag →" (same Accent 1 CTA)
- Small print: "Works with any phone camera. No app install needed."

### 8. FOOTER
- TagTale wordmark (left)
- Links: About · Blog · Sponsor · Privacy · Terms
- "© 2026 TagTale" right-aligned
- Dark/light mode toggle
- NO social media icons

─── TECHNICAL REQUIREMENTS ─────────────────────────────────────────────────────
- Next.js 14 App Router, TypeScript, Tailwind CSS
- No emoji anywhere in UI (use SVG icons from lucide-react or custom inline SVGs)
- Dark mode via `class` strategy — ThemeProvider wraps page
- Never white-on-white or black-on-black
- Fully responsive (mobile-first)
- Smooth scroll between sections
- Intersection Observer for scroll-triggered animations (counters, fade-ins)
- Open Graph tags for social sharing
- Page speed: no third-party scripts (analytics inline only)
- Separate route: app/(marketing)/page.tsx  (does NOT use the main app layout)
- The app itself (feed, object pages) is completely separate from marketing pages

─── DESIGN PRINCIPLES ───────────────────────────────────────────────────────────
1. The landing page is COLOURFUL — the app is monochrome. This contrast is intentional.
2. The landing page MUST show the app as clean/minimal in contrast to the vivid marketing.
3. Every section should have clear visual hierarchy: one dominant element per section.
4. Photography/illustration policy: SVG illustrations only, no stock photos.
5. The QR code as a design motif: use it in backgrounds, as decorative elements.
6. Typography is the hero — large, confident, well-spaced headings.
7. Micro-animations: subtle entrance animations, hover states, button interactions.
8. Accessibility: WCAG AA minimum contrast, keyboard navigable, screen reader friendly.

─── COMPONENT STRUCTURE ─────────────────────────────────────────────────────────
app/(marketing)/
  page.tsx              — main landing page
  layout.tsx            — marketing layout (no app chrome)
  components/
    HeroSection.tsx
    UseCaseCard.tsx
    HowItWorks.tsx
    AppPreview.tsx
    SponsorSection.tsx
    TestimonialsSection.tsx
    CtaSection.tsx
    MarketingNav.tsx     — sticky nav with Logo + Sign in + Theme toggle
    MarketingFooter.tsx
```

---

## Iteration notes

- v0.1: Initial brief (April 2026)
- TODO: Add real screenshots once app is deployed
- TODO: A/B test headline variants: "Every object has a story" vs "What's the story of this object?"
- TODO: Add video demo (30s loop, no audio) once MVP is live
- TODO: Localise for German market (first expansion target)
- TODO: Add sponsor enquiry form with lead capture
