/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome)
 * nav: N11 Mega-menu (columns=3, feature cell=promo card, scrim=dim only)
 * pre-emit critique: P5 H4 E5 S5 R5 V4
 * design-system: design.md · designed-as-app
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { ChevronDown, ShoppingCart, X } from "lucide-react";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { useLocaleNavigation } from "@/hooks/use-locale-navigation";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { TypographicLink } from "@/components/ui/editorial";
import { COLOR_FAMILIES, PRODUCT_CATEGORIES } from "@/lib/constants/color-families";

// Inline vi/en labels keep the bar hydration-safe — the language store settles
// on the client, and a hook-based lookup here would flash the wrong label.
const NAV_LINKS = [
  { href: "/products", keyVi: "Sản phẩm", keyEn: "Products", motionId: "products" },
  { href: "/colors", keyVi: "Bảng màu", keyEn: "Colors", motionId: "colours" },
  {
    href: "/color-visualizer",
    keyVi: "Phối màu",
    keyEn: "Visualizer",
    motionId: "visualizer",
  },
  { href: "/find-dealer", keyVi: "Đại lý", keyEn: "Dealers", motionId: "dealers" },
  { href: "/blog", keyVi: "Xu hướng", keyEn: "Trends", motionId: "trends" },
] as const;

type NavMotionId = (typeof NAV_LINKS)[number]["motionId"];

/** The two nav destinations that carry a mega-menu panel. */
type PanelId = "/products" | "/colors";
const PANEL_HREFS: PanelId[] = ["/products", "/colors"];

export default function Header() {
  const { language, routePath, localize, switchLanguage } = useLocaleNavigation();
  const t = useTrans(language);
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);
  const { data: session, status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [mountedPanels, setMountedPanels] = useState<PanelId[]>([]);
  const [condensed, setCondensed] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<PanelId, HTMLButtonElement | null>>>({});

  const openPanelById = useCallback((panelId: PanelId | null) => {
    setOpenPanel(panelId);
    if (panelId) {
      setMountedPanels((current) =>
        current.includes(panelId) ? current : [...current, panelId],
      );
    }
  }, []);

  const closePanel = useCallback(
    (returnFocus = false) => {
      setOpenPanel((current) => {
        if (current && returnFocus) triggerRefs.current[current]?.focus();
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    setMounted(true);

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (avatarRef.current && !avatarRef.current.contains(target)) setIsAvatarOpen(false);
      if (navRef.current && !navRef.current.contains(target)) setOpenPanel(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsAvatarOpen(false);
      setOpenPanel((current) => {
        if (current) triggerRefs.current[current]?.focus();
        return null;
      });
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Scroll condense. The bar shrinks past the threshold and expands again at
  // the top; an open panel closes on the way so it cannot float detached from a
  // bar that has moved. rAF-throttled, and the threshold has hysteresis so a
  // scroll that hovers around the boundary cannot flutter.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setCondensed((current) => (current ? y > 24 : y > 72));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (condensed) setOpenPanel(null);
  }, [condensed]);

  // A navigation always dismisses the panel and the mobile sheet.
  useEffect(() => {
    setOpenPanel(null);
    setMobileOpen(false);
    setIsAvatarOpen(false);
  }, [routePath]);

  const cartCount = mounted ? getCartItemCount() : 0;
  const user = session?.user;
  const userRole = (user as { role?: string } | undefined)?.role;
  const isAuthenticated = mounted && status === "authenticated" && Boolean(user);

  if (routePath.startsWith("/admin")) return null;

  const label = (link: (typeof NAV_LINKS)[number]) =>
    language === "vi" ? link.keyVi : link.keyEn;

  const initials = (user?.name || user?.email || "??").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setMobileOpen(false);
    setIsAvatarOpen(false);
    await signOut({ redirect: false });
    window.location.href = `${window.location.origin}${localize("/")}`;
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b bg-atelier-paper",
          "motion-safe:transition-colors motion-safe:duration-fl-base motion-safe:ease-fl-out",
          // A stronger hairline when condensed reads as a subtly lifted bar.
          // design.md permits a shadow on only two surfaces, so elevation here
          // is carried by the rule, not a drop shadow.
          condensed ? "border-atelier-rule-strong" : "border-atelier-rule",
        )}
      >
        {/* Paint-chart strip — the five band shades as a hairline of real
            catalogue colour across the top of the bar. The one piece of chrome
            that says "paint house" before a single word is read. Purely
            decorative, token-only, no motion. */}
        <div aria-hidden="true" className="flex h-[3px] w-full">
          <span className="flex-1 bg-atelier-sage" />
          <span className="flex-1 bg-atelier-clay" />
          <span className="flex-1 bg-atelier-slate" />
          <span className="flex-1 bg-atelier-ochre" />
          <span className="flex-1 bg-atelier-espresso" />
        </div>
        <div
          className={cn(
            "mx-auto flex w-full max-w-[100rem] items-center justify-between gap-fl-md px-[clamp(1rem,4vw,1.5rem)]",
            "motion-safe:transition-[height] motion-safe:duration-fl-base motion-safe:ease-fl-out",
            condensed ? "h-14 md:h-16" : "h-16 md:h-[4.5rem]",
          )}
        >
          {/* Wordmark */}
          <div className="fl-masthead-cell flex min-h-11 shrink-0 items-center gap-fl-xs border-r border-atelier-rule pr-fl-lg">
            <Link
              href={localize("/")}
              className={cn(
                "flex min-h-11 origin-left items-center whitespace-nowrap font-serif text-fl-2xl font-medium leading-none tracking-[0.18em] text-atelier-ink",
                "motion-safe:transition-transform motion-safe:duration-fl-base motion-safe:ease-fl-out",
                condensed ? "scale-90" : "scale-100",
              )}
              onClick={() => setMobileOpen(false)}
            >
              FLOF
            </Link>
            <span
              className={cn(
                "whitespace-nowrap border-l border-atelier-rule pl-fl-xs text-[0.58rem] uppercase leading-none tracking-[0.19em] text-atelier-ink-2",
                "motion-safe:transition-opacity motion-safe:duration-fl-base motion-safe:ease-fl-out",
                condensed ? "hidden" : "hidden xl:inline",
              )}
            >
              {t.headerTagline}
            </span>
          </div>

          {/* Desktop nav — two panel triggers, three plain destinations */}
          <div ref={navRef} className="hidden xl:block">
            <nav aria-label={t.headerMenu}>
              <ul className="flex items-center gap-fl-md">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    routePath === link.href || routePath.startsWith(`${link.href}/`);
                  const panelId = PANEL_HREFS.includes(link.href as PanelId)
                    ? (link.href as PanelId)
                    : null;
                  const isOpen = panelId !== null && openPanel === panelId;

                  return (
                    <li
                      key={link.href}
                      className="fl-nav-item group relative flex items-center"
                      data-motion={link.motionId}
                    >
                      <Link
                        href={localize(link.href)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "fl-nav-link relative flex min-h-11 items-center whitespace-nowrap px-fl-2xs text-fl-sm leading-none transition-colors duration-fl-fast ease-fl-out",
                          "hover:text-atelier-accent",
                          isActive
                            ? "text-atelier-ink"
                            : "text-atelier-ink-2",
                        )}
                      >
                        <span>{label(link)}</span>
                      </Link>
                      <NavSignature kind={link.motionId} active={isActive} />
                      {panelId ? (
                        <button
                          type="button"
                          ref={(node) => {
                            triggerRefs.current[panelId] = node;
                          }}
                          onClick={() => openPanelById(isOpen ? null : panelId)}
                          aria-expanded={isOpen}
                          aria-controls={`panel-${panelId.slice(1)}`}
                          aria-label={isOpen ? t.headerClosePanel : t.headerOpenPanel}
                          className="ml-1 flex h-6 w-6 items-center justify-center text-atelier-ink-3 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink"
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-fl-fast ease-fl-out",
                              isOpen && "rotate-180",
                            )}
                          />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Mega-menu panels */}
            {PANEL_HREFS.map((panelId) => (
              <MegaPanel
                key={panelId}
                id={`panel-${panelId.slice(1)}`}
                open={openPanel === panelId}
              >
                {!mountedPanels.includes(panelId) ? null : panelId === "/colors" ? (
                  <ColourPanel
                    t={t}
                    localize={localize}
                    onNavigate={() => closePanel()}
                  />
                ) : (
                  <ProductPanel
                    t={t}
                    localize={localize}
                    onNavigate={() => closePanel()}
                  />
                )}
              </MegaPanel>
            ))}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-fl-sm">
            <button
              type="button"
              onClick={switchLanguage}
              className="hidden min-h-11 items-center whitespace-nowrap text-fl-2xs uppercase tracking-[0.14em] text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink sm:inline-flex md:min-h-10"
              aria-label={
                language === "vi"
                  ? "Switch language to English"
                  : "Chuyển ngôn ngữ sang Tiếng Việt"
              }
            >
              {language === "vi" ? "EN" : "VI"}
            </button>

            <Link
              href={localize("/cart")}
              onClick={() => setMobileOpen(false)}
              // Below sm the visible label is hidden and both the icon and the
              // count are aria-hidden, which left the link with no accessible
              // name at all. The label is static so it cannot desync on hydrate.
              aria-label={t.headerCart}
              className="flex min-h-11 items-center gap-fl-2xs whitespace-nowrap text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:text-atelier-accent md:min-h-10"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t.headerCart}</span>
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-fl-pill bg-atelier-ink px-1 text-fl-2xs text-atelier-paper"
                aria-hidden="true"
              >
                {cartCount}
              </span>
            </Link>

            {isAuthenticated ? (
              <div ref={avatarRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsAvatarOpen(!isAvatarOpen)}
                  aria-expanded={isAvatarOpen}
                  aria-haspopup="menu"
                  className="flex h-10 w-10 items-center justify-center rounded-control bg-atelier-accent text-fl-2xs font-medium text-atelier-accent-ink"
                >
                  {initials}
                </button>

                {isAvatarOpen ? (
                  <div
                    role="menu"
                    className="fl-panel-in absolute right-0 top-full mt-fl-2xs w-56 rounded-surface border border-atelier-rule bg-atelier-paper shadow-[0_8px_28px_rgb(0_0_0/0.10)]"
                  >
                    <div className="border-b border-atelier-rule px-fl-sm py-fl-xs">
                      <p className="truncate text-fl-sm text-atelier-ink">
                        {user?.name || user?.email}
                      </p>
                      <p className="truncate text-fl-xs text-atelier-ink-2">{user?.email}</p>
                    </div>
                    <div className="flex flex-col p-fl-3xs">
                      <Link
                        role="menuitem"
                        href={localize("/profile")}
                        onClick={() => setIsAvatarOpen(false)}
                        className="flex min-h-11 items-center px-fl-xs text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 md:min-h-10"
                      >
                        {t.headerAccount}
                      </Link>
                      {userRole === "ADMIN" ? (
                        <Link
                          role="menuitem"
                          href={localize("/admin")}
                          onClick={() => setIsAvatarOpen(false)}
                          className="flex min-h-11 items-center px-fl-xs text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 md:min-h-10"
                        >
                          Admin
                        </Link>
                      ) : null}
                      <button
                        role="menuitem"
                        type="button"
                        onClick={handleSignOut}
                        className="flex min-h-11 items-center px-fl-xs text-left text-fl-sm text-atelier-danger transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 md:min-h-10"
                      >
                        {t.headerLogout}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href={localize("/login")}
                onClick={() => setMobileOpen(false)}
                className="hidden min-h-10 items-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-md text-fl-sm text-atelier-accent-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-accent-hover md:inline-flex"
              >
                {t.headerLogin}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              className="flex min-h-11 items-center whitespace-nowrap border-b border-atelier-ink text-fl-2xs uppercase tracking-[0.14em] text-atelier-ink xl:hidden"
            >
              {mobileOpen ? t.headerCloseMenu : t.headerMenu}
            </button>
          </div>
        </div>

        {/* Scrim — dim only. design.md bans glassmorphism, so no backdrop blur. */}
        {openPanel ? (
          <div
            aria-hidden="true"
            className={cn(
              "fixed inset-x-0 -z-10 h-screen bg-atelier-espresso/25",
              condensed ? "top-14 md:top-16" : "top-16 md:top-[4.5rem]",
            )}
          />
        ) : null}
      </header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 flex flex-col justify-end p-fl-sm sm:justify-center sm:items-center">
            <safeMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-atelier-espresso/35"
            />

            <safeMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex w-full max-w-sm flex-col gap-fl-md rounded-surface border border-atelier-rule bg-atelier-paper p-fl-md text-left shadow-[0_12px_40px_rgb(0_0_0/0.16)]"
            >
              <div className="flex items-center justify-between border-b border-atelier-rule pb-fl-xs">
                <span className="font-serif text-fl-lg tracking-[0.14em] text-atelier-ink">
                  FLOF
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t.headerCloseMenu}
                  className="flex h-11 w-11 items-center justify-center text-atelier-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label={t.headerMenu}>
                <ul className="flex flex-col">
                  {NAV_LINKS.map((link) => {
                    const isActive =
                      routePath === link.href || routePath.startsWith(`${link.href}/`);
                    return (
                      <li
                        key={link.href}
                        className="fl-nav-item group relative border-b border-atelier-rule"
                        data-motion={link.motionId}
                      >
                        <Link
                          href={localize(link.href)}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex min-h-11 items-center justify-between whitespace-nowrap text-fl-md",
                            isActive ? "text-atelier-ink" : "text-atelier-ink-2",
                          )}
                        >
                          <span>{label(link)}</span>
                        </Link>
                        <NavSignature kind={link.motionId} active={isActive} />
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="flex flex-col gap-fl-2xs">
                {isAuthenticated ? (
                  <>
                    <p className="fl-label">{user?.email}</p>
                    <Link
                      href={localize("/profile")}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-11 items-center whitespace-nowrap text-fl-sm text-atelier-ink"
                    >
                      {t.headerAccount}
                    </Link>
                    {userRole === "ADMIN" ? (
                      <Link
                        href={localize("/admin")}
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-11 items-center whitespace-nowrap text-fl-sm text-atelier-ink"
                      >
                        Admin
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex min-h-11 items-center whitespace-nowrap text-left text-fl-sm text-atelier-danger"
                    >
                      {t.headerLogout}
                    </button>
                  </>
                ) : (
                  <Link
                    href={localize("/login")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-md text-fl-sm text-atelier-accent-ink"
                  >
                    {t.headerLogin}
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-atelier-rule pt-fl-xs">
                <span className="fl-label">{t.headerLanguage}</span>
                <button
                  type="button"
                  onClick={switchLanguage}
                  className="flex min-h-11 items-center whitespace-nowrap text-fl-sm text-atelier-ink"
                  aria-label={
                    language === "vi"
                      ? "Switch language to English"
                      : "Chuyển ngôn ngữ sang Tiếng Việt"
                  }
                >
                  {language === "vi" ? "English" : "Tiếng Việt"}
                </button>
              </div>
            </safeMotion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function NavSignature({ kind, active }: { kind: NavMotionId; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="fl-nav-signature"
      data-kind={kind}
      data-active={active ? "true" : "false"}
    >
      <span className="fl-nav-mark fl-nav-mark-a" />
      <span className="fl-nav-mark fl-nav-mark-b" />
      <span className="fl-nav-mark fl-nav-mark-c" />
    </span>
  );
}

/* ---------------------------------------------------------------- panels -- */

function MegaPanel({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      hidden={!open}
      className="fl-panel-in absolute inset-x-0 top-full border-t border-atelier-rule bg-atelier-paper shadow-[0_16px_40px_rgb(0_0_0/0.10)]"
    >
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-lg">
        {children}
      </div>
    </div>
  );
}

type PanelCopy = ReturnType<typeof useTrans>;

function PanelPromo({
  title,
  body,
  cta,
  href,
  onNavigate,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-fl-2xs border-l border-atelier-rule pl-fl-md">
      <h3 className="font-serif text-fl-xl text-atelier-ink">{title}</h3>
      <p className="fl-measure-tight text-fl-sm text-atelier-ink-2">{body}</p>
      <TypographicLink href={href} onClick={onNavigate} className="mt-fl-2xs">
        {cta}
      </TypographicLink>
    </div>
  );
}

function ColourPanel({
  t,
  localize,
  onNavigate,
}: {
  t: PanelCopy;
  localize: (href: string) => string;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-fl-lg">
      <div className="col-span-8">
        <p className="fl-label">{t.headerColourPanelTitle}</p>
        <p className="fl-measure mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {t.headerColourPanelNote}
        </p>
        <ul className="mt-fl-md grid grid-cols-3 gap-x-fl-md">
          {COLOR_FAMILIES.map((family) => (
            <li key={family.value} className="border-b border-atelier-rule">
              <Link
                href={localize(`/colors?family=${family.value}`)}
                onClick={onNavigate}
                className="flex min-h-11 items-center gap-fl-xs whitespace-nowrap text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:text-atelier-accent"
              >
                <ColorSwatch
                  color={family.swatch}
                  className="fl-swatch h-5 w-5 shrink-0 rounded-swatch"
                />
                {t[family.labelKey]}
              </Link>
            </li>
          ))}
        </ul>
        <TypographicLink
          href={localize("/colors")}
          onClick={onNavigate}
          className="mt-fl-md"
        >
          {t.headerViewAllColours}
        </TypographicLink>
      </div>

      <div className="col-span-4">
        <PanelPromo
          title={t.headerPromoVisualizerTitle}
          body={t.headerPromoVisualizerBody}
          cta={t.navVisualizer}
          href={localize("/color-visualizer")}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

function ProductPanel({
  t,
  localize,
  onNavigate,
}: {
  t: PanelCopy;
  localize: (href: string) => string;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-fl-lg">
      <div className="col-span-8">
        <p className="fl-label">{t.headerProductPanelTitle}</p>
        <p className="fl-measure mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {t.headerProductPanelNote}
        </p>
        <ul className="mt-fl-md grid grid-cols-2 gap-x-fl-md">
          {PRODUCT_CATEGORIES.map((category) => (
            <li key={category.slug} className="border-b border-atelier-rule">
              <Link
                href={localize(`/products?category=${category.slug}`)}
                onClick={onNavigate}
                className="flex min-h-11 items-center whitespace-nowrap text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:text-atelier-accent"
              >
                {t[category.labelKey]}
              </Link>
            </li>
          ))}
        </ul>
        <TypographicLink
          href={localize("/products")}
          onClick={onNavigate}
          className="mt-fl-md"
        >
          {t.headerViewAllProducts}
        </TypographicLink>
      </div>

      <div className="col-span-4">
        <PanelPromo
          title={t.headerPromoQuoteTitle}
          body={t.headerPromoQuoteBody}
          cta={t.navQuote}
          href={localize("/quote-request")}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
