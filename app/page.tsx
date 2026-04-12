import Image from 'next/image'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import BrandMark from '@/components/ui/BrandMark'
import {
  QrCode,
  PenSquare,
  Route,
  Compass,
  ShieldCheck,
  Users,
  ArrowRight,
  ScanLine,
  Mail,
} from 'lucide-react'
import TaggedObjectsCarousel from '@/components/landing/TaggedObjectsCarousel'
import { taggedObjectSlides } from '@/lib/landing-carousel-slides'
export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/feed')

  return (
    <div className="min-h-dvh board-vignette overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:border focus:border-edge-2 focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:text-ink focus:shadow-lg"
      >
        Skip to main content
      </a>

      <main id="main-content">
      {/* Screen 1: nav + hero */}
      <section className="flex flex-col pb-4 sm:pb-8" aria-label="Introduction">
        <header className="tt-shell w-full max-w-5xl mx-auto flex shrink-0 items-center justify-between gap-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 sm:pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <BrandMark size={36} className="text-ink-2 shrink-0" />
            <Logo size="md" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-ink-2 hover:text-ink min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 transition-colors"
          >
            Log in
          </Link>
        </header>

        <div className="flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
          <div className="landing-hero-shell tt-shell max-w-5xl mx-auto w-full pt-2">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-14 lg:items-center">
              <div className="order-2 lg:order-1 max-w-lg mx-auto lg:mx-0 text-center lg:text-left motion-safe:animate-slide-up motion-reduce:animate-none">
                <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-ink-3 tracking-wide mb-5 sm:mb-6">
                  <Compass className="h-4 w-4 text-ink-3 shrink-0" aria-hidden />
                  Stories tied to real objects
                </p>
                <h1 className="text-[1.65rem] sm:text-4xl lg:text-[2.5rem] font-semibold tracking-tight text-ink leading-[1.12] mb-5 sm:mb-6">
                  A story lives on the things around you.
                </h1>
                <p className="text-[1.0625rem] sm:text-lg text-ink-2 leading-relaxed mb-8 sm:mb-10">
                  TagTale links a feed to QR codes and tags on real things — on a trip, at a café, or on something
                  passed between friends. Scan once to connect.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-full text-base font-medium bg-ink text-page hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Get started
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full text-base font-medium text-ink-2 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  >
                    How it works
                  </a>
                </div>
                <p className="mt-4 sm:mt-5 text-sm text-ink-3">We&apos;ll email you a one-time code — no password to remember.</p>
              </div>

              <div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] bg-surface-2 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
                  <Image
                    src="/landing/hero.webp"
                    alt="Friends outdoors sharing a moment while one person uses a phone"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screen 2: moments */}
      <section
        className="flex flex-col border-t border-edge/35 py-16 sm:py-24"
        aria-labelledby="moments-heading"
      >
        <div className="tt-shell max-w-5xl mx-auto w-full">
          <div className="max-w-xl mb-8 sm:mb-10">
            <h2 id="moments-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Out in the world, or on the couch
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-2 leading-relaxed">
              Same app: a quick scan when you&apos;re exploring, a quiet moment when you&apos;re home with people you
              like.
            </p>
          </div>

          <div className="grid gap-8 sm:gap-10 md:gap-12 md:grid-cols-2">
            <figure>
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-surface-2">
                <Image
                  src="/landing/scan.webp"
                  alt="Person scanning a QR code on a bicycle with their phone"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <figcaption className="mt-4 sm:mt-5">
                <p className="text-base font-medium text-ink">Travel &amp; discovery</p>
                <p className="mt-1.5 text-[0.9375rem] text-ink-2 leading-relaxed">
                  A tag can sit on a rental, a trail marker, or a pop-up — scan and see who else passed through.
                </p>
              </figcaption>
            </figure>

            <figure>
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-surface-2">
                <Image
                  src="/landing/together.webp"
                  alt="Two friends on a sofa looking at a phone together and smiling"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <figcaption className="mt-4 sm:mt-5">
                <p className="text-base font-medium text-ink">Friendship</p>
                <p className="mt-1.5 text-[0.9375rem] text-ink-2 leading-relaxed">
                  Pass the phone, laugh at an old post — feeds stay about the thing, not the algorithm.
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Screen 3: features */}
      <section
        className="flex flex-col border-t border-edge/35 py-16 sm:py-24"
        aria-labelledby="features-heading"
      >
        <div className="tt-shell max-w-3xl mx-auto w-full">
          <h2 id="features-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-3 sm:mb-4">
            Plain and human
          </h2>
          <p className="text-base sm:text-lg text-ink-2 leading-relaxed mb-10 sm:mb-12 max-w-2xl">
            Nothing flashy — just a few ways TagTale keeps the focus on people, places, and the objects between you.
          </p>

          <ul className="space-y-0 divide-y divide-edge/60">
            <li className="flex gap-4 sm:gap-8 py-8 sm:py-10 first:pt-0">
              <ScanLine className="h-6 w-6 text-ink-3 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Scan to drop in</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed">
                  Open the feed for that sticker or tag — notes and photos from folks who were there before you.
                </p>
              </div>
            </li>
            <li className="flex gap-4 sm:gap-8 py-8 sm:py-10">
              <PenSquare className="h-6 w-6 text-ink-3 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Post with context</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed">
                  Your moment stays tied to the object — handy when you&apos;re reminiscing or planning the next trip.
                </p>
              </div>
            </li>
            <li className="flex gap-4 sm:gap-8 py-8 sm:py-10">
              <Route className="h-6 w-6 text-ink-3 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Follow the journey</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed">
                  Things move, get lent, or show up again. Follow along without a noisy home timeline.
                </p>
              </div>
            </li>
          </ul>

          <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-edge/60">
            <p className="text-[0.9375rem] text-ink-2 leading-relaxed flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
              <span className="flex gap-3 sm:max-w-xs">
                <Users className="h-5 w-5 text-ink-3 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
                <span>
                  <span className="font-medium text-ink">Built around shared objects</span>
                  — discovery feels personal, not like a megaphone.
                </span>
              </span>
              <span className="flex gap-3 sm:max-w-xs">
                <ShieldCheck className="h-5 w-5 text-ink-3 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
                <span>
                  <span className="font-medium text-ink">Sign in with email</span>
                  — we send a link; you don&apos;t juggle passwords.
                </span>
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Screen 4: carousel */}
      <TaggedObjectsCarousel
        slides={taggedObjectSlides}
        heading="Tags on everyday things"
        subheading="Pet tags, produce, geocaches, garden gnomes, statues and monuments, park benches, bumpers, trail markers, mugs, and bags — if it can wear a sticker or tag, it can carry a story."
        className="flex flex-col justify-center border-t border-edge/35 py-16 sm:py-24"
      />

      {/* Screen 5: how it works */}
      <section
        id="how-it-works"
        className="flex flex-col gap-10 border-t border-edge/35 py-16 sm:py-24"
        aria-labelledby="how-heading"
      >
        <div className="tt-shell max-w-5xl mx-auto w-full">
          <div className="rounded-[1.5rem] sm:rounded-[1.75rem] border border-edge/45 bg-surface/20 shadow-[0_12px_48px_rgba(0,0,0,0.35)] px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="max-w-xl mb-8 sm:mb-10">
              <h2 id="how-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                How it works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-ink-2 leading-relaxed">Three steps.</p>
            </div>

            <ol className="space-y-10 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8 lg:gap-10">
              <li>
                <div className="flex items-baseline gap-3 mb-2 sm:mb-3">
                  <span className="text-sm font-semibold tabular-nums text-ink-3">01</span>
                  <QrCode className="h-5 w-5 text-ink-3 shrink-0" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Spot a tag</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed">
                  On a table tent, a bike, a suitcase — wherever you see a TagTale QR.
                </p>
              </li>
              <li>
                <div className="flex items-baseline gap-3 mb-2 sm:mb-3">
                  <span className="text-sm font-semibold tabular-nums text-ink-3">02</span>
                  <Mail className="h-5 w-5 text-ink-3 shrink-0" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Confirm your email</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed">
                  We send one link. Tap it — that&apos;s your sign-in. No password vault required.
                </p>
              </li>
              <li>
                <div className="flex items-baseline gap-3 mb-2 sm:mb-3">
                  <span className="text-sm font-semibold tabular-nums text-ink-3">03</span>
                  <PenSquare className="h-5 w-5 text-ink-3 shrink-0" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Browse &amp; share</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-2 leading-relaxed">
                  Read the feed, add a photo or note, follow what you care about.
                </p>
              </li>
            </ol>

            <div className="mt-10 sm:mt-12">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-full text-base font-medium bg-ink text-page hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Start with email
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-edge/35 pt-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="tt-shell max-w-5xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-ink-3">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span>Stories that travel with you.</span>
            </div>
            <Link
              href="/login"
              className="text-ink-2 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 rounded-md"
            >
              Log in
            </Link>
          </div>
        </div>
      </footer>
      </main>
    </div>
  )
}
