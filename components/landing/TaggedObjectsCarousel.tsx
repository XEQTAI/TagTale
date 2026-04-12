'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CarouselSlide = {
  src: string
  alt: string
  caption: string
}

type Props = {
  slides: CarouselSlide[]
  heading: string
  subheading: string
  /** Extra classes on the outer section (e.g. landing scroll-snap + min-height). */
  className?: string
}

export default function TaggedObjectsCarousel({ slides, heading, subheading, className = '' }: Props) {
  const [index, setIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(true)
  const regionId = useId()
  const liveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (reduceMotion) return
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 6500)
    return () => window.clearInterval(t)
  }, [slides.length, reduceMotion])

  useEffect(() => {
    const el = liveRef.current
    if (!el) return
    el.textContent = `Slide ${index + 1} of ${slides.length}: ${slides[index].caption}`
  }, [index, slides])

  const onCarouselKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    }
  }

  if (slides.length === 0) return null

  const current = slides[index]

  return (
    <section className={className.trim()} aria-labelledby={`${regionId}-h`}>
      <div className="tt-shell max-w-5xl mx-auto w-full py-10 sm:py-14 lg:py-16">
        <div className="max-w-xl mb-10 sm:mb-12">
          <h2 id={`${regionId}-h`} className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            {heading}
          </h2>
          <p className="mt-3 text-lg text-ink-2 leading-relaxed">{subheading}</p>
        </div>

        <div
          className="relative rounded-[1.75rem] bg-surface-2/80 overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.25)]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Tagged objects"
          tabIndex={0}
          onKeyDown={onCarouselKeyDown}
        >
          <div ref={liveRef} className="sr-only" aria-live="polite" />

          <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[2/1] w-full">
            {slides.map((slide, i) => (
              <div
                key={slide.src}
                className={`absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:duration-0 ${
                  i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                }`}
                aria-hidden={i !== index}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 900px"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 px-4 pt-4 sm:px-5 sm:pt-5 border-t border-edge/60 bg-page/60 backdrop-blur-sm">
            <div className="flex gap-2 sm:gap-2.5 justify-center sm:justify-start overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
              {slides.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${slide.caption}`}
                  aria-current={i === index ? 'true' : undefined}
                  className={`relative h-11 w-[4.5rem] sm:h-14 sm:w-20 md:h-16 md:w-24 shrink-0 overflow-hidden rounded-lg sm:rounded-xl transition-[box-shadow,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                    i === index ? 'ring-2 ring-ink ring-offset-2 ring-offset-page' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={slide.src} alt="" fill className="object-cover" sizes="120px" />
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1 pb-4 sm:px-2 sm:pb-5">
              <p className="text-[0.9375rem] text-ink-2 leading-snug min-h-[2.5rem] sm:min-h-0 flex items-center text-center sm:text-left">
                <span className="font-medium text-ink">{current.caption}</span>
              </p>

              <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-surface hover:bg-surface-2 text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <div className="flex gap-1.5 px-1" aria-hidden>
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 rounded-full transition-all ${
                        i === index ? 'w-7 bg-ink' : 'w-2 bg-ink-3/40'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-surface hover:bg-surface-2 text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-ink-3 text-center sm:text-left">
          Every sticker links to one feed — scan with your phone camera to jump in.
        </p>
      </div>
    </section>
  )
}
