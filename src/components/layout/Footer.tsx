/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome) · footer: Ft7 Newsletter-first (layout=split, submit=arrow link, privacy=yes) · design-system: design.md · designed-as-app */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/locale";

import { EditorialSection, Rule } from "@/components/ui/editorial";
import { toast } from "@/components/ui/csp-toast";
import { useTrans } from "@/lib/dictionary";
import { useLanguageStore } from "@/store/language-store";
import { SOCIAL_LINKS } from "@/lib/constants/social-links";

/**
 * Ft7 Newsletter-first. The signup form is the primary element; the wordmark,
 * the index and the copyright sit beneath a hairline rule in muted 12px type.
 *
 * Ft3 — the four-column link index with a social icon row and a tiny centred
 * copyright — is banned outright by design.md § Shared chrome as the most
 * recognisable AI fingerprint. Every href from that arrangement survives here,
 * demoted into the muted meta index.
 */

/** Muted meta links: destination + the dictionary key that labels it. */
const META_LINK_KEYS = [
  { href: "/colors", key: "navColors" },
  { href: "/color-visualizer", key: "navVisualizer" },
  { href: "/find-dealer", key: "navDealers" },
  { href: "/products?category=son-noi-that", key: "footerCatInterior" },
  { href: "/products?category=son-ngoai-that", key: "footerCatExterior" },
  { href: "/products?category=son-lot", key: "footerCatPrimer" },
  { href: "/products?category=son-chong-tham", key: "footerCatWaterproof" },
] as const;

const LEGAL_LINK_KEYS = [
  { href: "/privacy-policy", key: "footerPrivacyPolicy" },
  { href: "/terms-of-service", key: "footerTerms" },
  { href: "/cookie-policy", key: "footerCookies" },
] as const;

const META_LINK_CLASS =
  "inline-flex min-h-11 items-center whitespace-nowrap text-fl-xs text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-6";  // 24px floor, per WCAG 2.2 target size

export default function Footer() {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Strip the locale first: the raw pathname is `/vi/admin/...`, so a bare
  // startsWith("/admin") would leak the footer onto every admin route.
  if (stripLocalePrefix(pathname || "/").pathname.startsWith("/admin")) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      toast.success(t.footerSubscribeSuccess);
      setEmail("");
    } catch {
      toast.error(t.footerSubscribeError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-atelier-rule bg-atelier-paper-2 text-atelier-ink">
      {/* Deliberately top-heavy: the letter gets the air, the meta does not. */}
      <EditorialSection
        as="div"
        // Extra bottom room below sm: the floating chat bubble is pinned to the
        // viewport corner, so on a phone it lands on the last row unless the
        // content stops short of it. The sm: right padding does the same job
        // horizontally once there is width to spare.
        className="pb-fl-3xl pt-fl-2xl sm:pb-fl-lg md:pt-fl-3xl"
      >
        {/* Primary element — the letter. 7/5 edge to edge, no dead gutter. */}
        <div className="grid gap-fl-xl md:grid-cols-12">
          <form onSubmit={handleSubscribe} className="md:col-span-7">
            <h2 className="fl-display text-fl-2xl">{t.footerLetterTitle}</h2>
            <p className="fl-measure-tight mt-fl-2xs text-fl-sm text-atelier-ink-2">
              {t.footerLetterNote}
            </p>

            <label
              htmlFor="footer-newsletter-email"
              className="mt-fl-md block text-fl-sm font-medium text-atelier-ink"
            >
              {t.footerEmailLabel}
            </label>
            <div className="mt-fl-2xs flex max-w-md flex-col gap-fl-2xs sm:flex-row sm:items-center sm:gap-fl-sm">
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.footerEmailPlaceholder}
                className="min-h-11 w-full flex-1 rounded-control border border-atelier-rule bg-atelier-paper px-fl-sm text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out placeholder:text-atelier-ink-3 hover:border-atelier-rule-strong sm:w-auto"
              />
              {/* submit = arrow link (C3), not a filled button */}
              <button
                type="submit"
                disabled={isSubmitting}
                data-state={isSubmitting ? "loading" : undefined}
                className="inline-flex min-h-11 items-center gap-2 self-start whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness,opacity] duration-fl-fast ease-fl-out hover:decoration-2 active:opacity-80 disabled:opacity-60 sm:self-auto"
              >
                <span>{isSubmitting ? t.footerSubscribing : t.footerSubscribe}</span>
                <span aria-hidden="true" className="no-underline">
                  →
                </span>
              </button>
            </div>
            {/* privacy line = yes. ink-2, not ink-3 — ink-3 only clears 3:1. */}
            <p className="fl-measure-tight mt-fl-2xs text-fl-xs text-atelier-ink-2">
              {t.footerPrivacyNote}
            </p>
          </form>

          {/* Meta right — wordmark and the studio's own details. */}
          <div className="md:col-span-5">
            <p className="fl-display text-fl-lg">Maison de FLOF</p>
            <p className="mt-fl-2xs text-fl-xs text-atelier-ink-2">{t.footerBrandNote}</p>
            <address className="mt-fl-sm space-y-1 text-fl-xs not-italic text-atelier-ink-2">
              <span className="block">{t.footerAddress}</span>
              <span className="block">Hotline: 1800 1511 / 0900 000 001</span>
              <span className="block">contact@flof.vn</span>
            </address>
          </div>
        </div>

        <Rule className="mt-fl-xl" />

        {/* Muted 12px meta beneath the hairline. Still not a four-column index:
            no column headings, no icon row — the letter above is the hero and
            these stay demoted. They just spread across the full measure now
            instead of ragging inside a 56ch box. */}
        <nav
          aria-label={t.footerNavLabel}
          className="grid grid-cols-2 gap-x-fl-md gap-y-fl-3xs pt-fl-md sm:grid-cols-3 lg:grid-cols-5"
        >
          {META_LINK_KEYS.map((link) => (
            <Link key={link.href} href={link.href} className={META_LINK_CLASS}>
              {t[link.key]}
            </Link>
          ))}
          {LEGAL_LINK_KEYS.map((link) => (
            <a key={link.key} href={link.href} className={META_LINK_CLASS}>
              {t[link.key]}
            </a>
          ))}
        </nav>

        <Rule className="mt-fl-md" />

        {/* Colophon row — one line, copyright against social. The right padding
            reserves the corner the floating chat bubble and back-to-top control
            occupy; without it they sit on top of the last social link. */}
        <div className="flex flex-wrap items-center justify-between gap-x-fl-md gap-y-fl-2xs pt-fl-sm sm:pr-fl-3xl">
          <p className="text-fl-2xs text-atelier-ink-2">
            © {new Date().getFullYear()} FLOF. {t.footerRights}
          </p>
          {SOCIAL_LINKS.length > 0 && (
            <nav
              aria-label={t.footerSocialLabel}
              className="flex flex-wrap gap-x-fl-md gap-y-fl-3xs"
            >
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={META_LINK_CLASS}
                >
                  {link.name}
                </a>
              ))}
            </nav>
          )}
        </div>
      </EditorialSection>
    </footer>
  );
}
