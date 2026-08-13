/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome)
 * nav: N11 Mega-menu (columns=3, feature cell=promo card, scrim=dim only)
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * design-system: design.md · designed-as-app · architectural-rectilinear
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { MobileSheet } from "@/components/ui/mobile-sheet";
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
          condensed ? "border-atelier-rule-strong shadow-xs" : "border-atelier-rule",
        )}
      >
        {/* Paint-chart strip — the five band shades as a hairline of real
            catalogue colour across the top of the bar. */}
        <div aria-hidden="true" className="flex h-[3px] w-full overflow-hidden">
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
          {/* Wordmark & Subtitle Stack */}
          <div className="fl-masthead-cell flex min-h-11 shrink-0 items-center gap-fl-xs border-r border-atelier-rule pr-fl-lg">
            <Link
              href={localize("/")}
              className={cn(
                "flex min-h-11 origin-left items-center whitespace-nowrap font-serif text-fl-2xl font-bold leading-none tracking-[0.22em] text-atelier-ink transition-colors duration-fl-fast hover:text-atelier-accent",
                condensed ? "scale-90" : "scale-100",
              )}
              onClick={() => setMobileOpen(false)}
            >
              FLOF
            </Link>
            <span
              className="hidden xl:inline-block whitespace-nowrap border-l border-atelier-rule pl-fl-xs text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.16em] text-atelier-ink-2"
            >
              {language === "vi" ? (
                <>Sơn Cao Cấp<br />Chính Hãng</>
              ) : (
                <>Premium Paint<br />& Authentic</>
              )}
            </span>
          </div>

          {/* Desktop nav — Architectural Rectilinear Navigation */}
          <div ref={navRef} className="hidden xl:block">
            <nav aria-label={t.headerMenu}>
              <ul className="flex items-center gap-1">
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
                      <div
                        className={cn(
                          "flex items-center rounded-surface px-0.5 transition-all duration-fl-fast",
                          isActive
                            ? "bg-atelier-ink text-atelier-paper shadow-xs"
                            : isOpen
                            ? "bg-atelier-paper-2 text-atelier-ink font-semibold"
                            : "hover:bg-atelier-paper-2 text-atelier-ink-2 hover:text-atelier-ink",
                        )}
                      >
                        <Link
                          href={localize(link.href)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "fl-nav-link relative flex min-h-10 items-center whitespace-nowrap px-fl-xs text-fl-sm font-medium leading-none transition-colors duration-fl-fast ease-fl-out",
                            isActive
                              ? "text-atelier-paper font-semibold"
                              : isOpen
                              ? "text-atelier-ink font-semibold"
                              : "",
                          )}
                        >
                          <span>{label(link)}</span>
                        </Link>
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
                            className={cn(
                              "mr-0.5 flex h-6 w-6 items-center justify-center rounded-[2px] transition-colors duration-fl-fast ease-fl-out",
                              isActive
                                ? "text-atelier-paper/80 hover:text-atelier-paper hover:bg-white/20"
                                : isOpen
                                ? "text-atelier-ink hover:bg-atelier-paper-3/60"
                                : "text-atelier-ink-3 hover:text-atelier-ink hover:bg-atelier-paper-3/60",
                            )}
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform duration-fl-fast ease-fl-out",
                                isOpen && "rotate-180 text-atelier-accent",
                              )}
                            />
                          </button>
                        ) : null}
                      </div>
                      <NavSignature kind={link.motionId} active={isActive} />
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

          {/* Right Actions — Architectural Control Box (No rounded pills) */}
          <div className="flex shrink-0 items-center gap-fl-xs">
            <div className="flex items-center gap-1 p-0.5 bg-atelier-paper-2/90 hover:bg-atelier-paper-2 border border-atelier-rule rounded-control transition-all duration-fl-fast shadow-xs hover:border-atelier-rule-strong">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={switchLanguage}
                className="hidden sm:inline-flex min-h-11 items-center px-2.5 py-1 text-fl-2xs font-semibold uppercase tracking-[0.14em] rounded-surface hover:bg-atelier-paper text-atelier-ink-2 hover:text-atelier-ink transition-all duration-fl-fast"
                aria-label={
                  language === "vi"
                    ? "Switch language to English"
                    : "Chuyển sang Tiếng Việt"
                }
                title="Switch language"
              >
                {language === "vi" ? "ENGLISH" : "TIẾNG VIỆT"}
              </button>

              {/* Divider 1 */}
              <div className="hidden sm:block w-[1px] h-3.5 bg-atelier-rule" />

              {/* Cart */}
              <Link
                href={localize("/cart")}
                onClick={() => setMobileOpen(false)}
                aria-label={t.headerCart}
                className="flex min-h-11 items-center gap-1.5 px-2.5 py-1 rounded-surface hover:bg-atelier-paper text-atelier-ink transition-all duration-fl-fast text-fl-sm font-medium"
              >
                <ShoppingCart className="h-4 w-4 text-atelier-ink" aria-hidden="true" />
                <span className="hidden sm:inline text-fl-sm font-medium">{t.headerCart}</span>
                <span
                  className={cn(
                    "flex items-center justify-center text-[0.6875rem] font-bold rounded-[2px] min-w-4 h-4 px-1 shrink-0",
                    cartCount > 0
                      ? "bg-atelier-accent text-atelier-accent-ink"
                      : "bg-atelier-ink text-atelier-paper",
                  )}
                  aria-hidden="true"
                >
                  {cartCount}
                </span>
              </Link>

              {/* Account Avatar or Login */}
              {isAuthenticated ? (
                <>
                  {/* Divider 2 */}
                  <div className="hidden md:block w-[1px] h-3.5 bg-atelier-rule" />

                  <div ref={avatarRef} className="hidden md:block relative">
                    <button
                      type="button"
                      onClick={() => setIsAvatarOpen(!isAvatarOpen)}
                      aria-expanded={isAvatarOpen}
                      aria-haspopup="menu"
                      className="flex h-7 w-7 items-center justify-center rounded-control bg-atelier-accent text-fl-2xs font-bold text-atelier-accent-ink transition-transform hover:scale-105 shadow-xs"
                    >
                      {initials}
                    </button>

                    {isAvatarOpen ? (
                      <div
                        role="menu"
                        className="fl-panel-in absolute right-0 top-full mt-fl-2xs w-60 rounded-surface border border-atelier-rule bg-atelier-paper p-1 shadow-[0_12px_32px_rgb(0_0_0/0.12)] z-50"
                      >
                        <div className="border-b border-atelier-rule px-fl-sm py-fl-xs bg-atelier-paper-2/60 rounded-t-[1px]">
                          <p className="truncate text-fl-sm font-medium text-atelier-ink">
                            {user?.name || user?.email}
                          </p>
                          <p className="truncate text-fl-xs text-atelier-ink-2">{user?.email}</p>
                        </div>
                        <div className="flex flex-col py-1">
                          <Link
                            role="menuitem"
                            href={localize("/profile")}
                            onClick={() => setIsAvatarOpen(false)}
                            className="flex min-h-10 items-center rounded-[2px] px-fl-xs text-fl-sm text-atelier-ink transition-colors duration-fl-fast hover:bg-atelier-paper-2"
                          >
                            {t.headerAccount}
                          </Link>
                          {userRole === "ADMIN" ? (
                            <Link
                              role="menuitem"
                              href={localize("/admin")}
                              onClick={() => setIsAvatarOpen(false)}
                              className="flex min-h-10 items-center justify-between rounded-[2px] px-fl-xs text-fl-sm text-atelier-ink transition-colors duration-fl-fast hover:bg-atelier-paper-2"
                            >
                              <span>Admin</span>
                              <span className="rounded-[2px] bg-atelier-accent/10 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-atelier-accent">
                                Admin
                              </span>
                            </Link>
                          ) : null}
                          <button
                            role="menuitem"
                            type="button"
                            onClick={handleSignOut}
                            className="flex min-h-10 items-center rounded-[2px] px-fl-xs text-left text-fl-sm text-atelier-danger transition-colors duration-fl-fast hover:bg-atelier-paper-2"
                          >
                            {t.headerLogout}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  {/* Divider 2 for Login */}
                  <div className="hidden md:block w-[1px] h-3.5 bg-atelier-rule" />

                  <Link
                    href={localize("/login")}
                    onClick={() => setMobileOpen(false)}
                    className="hidden md:inline-flex items-center whitespace-nowrap rounded-control bg-atelier-accent px-3.5 py-1.5 text-fl-xs font-semibold text-atelier-accent-ink transition-colors duration-fl-fast hover:bg-atelier-accent-hover shadow-xs active:scale-[0.98]"
                  >
                    {t.headerLogin}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger Button with Animated Hamburger Morph */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t.headerCloseMenu : t.headerMenu}
              className="flex min-h-11 items-center gap-2 rounded-control border border-atelier-rule bg-atelier-paper-2 px-3 py-1.5 text-fl-2xs font-semibold uppercase tracking-[0.14em] text-atelier-ink transition-colors hover:bg-atelier-paper xl:hidden active:scale-[0.98]"
            >
              <span className="relative flex h-3.5 w-4 flex-col justify-between" aria-hidden="true">
                <span
                  className={cn(
                    "h-0.5 w-full bg-current transition-all duration-fl-fast origin-center",
                    mobileOpen && "translate-y-[5px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "h-0.5 w-full bg-current transition-all duration-fl-fast origin-center",
                    mobileOpen && "-translate-y-[5px] -rotate-45",
                  )}
                />
              </span>
              <span>{mobileOpen ? t.headerCloseMenu : t.headerMenu}</span>
            </button>
          </div>
        </div>

        {/* Scrim — dim only */}
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

      <MobileSheet
        closeLabel={t.headerCloseMenu}
        containerClassName="xl:hidden"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        title="FLOF"
      >
        <nav aria-label={t.headerMenu}>
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                routePath === link.href || routePath.startsWith(`${link.href}/`);
              return (
                <li
                  key={link.href}
                  className="fl-nav-item group relative"
                  data-motion={link.motionId}
                >
                  <Link
                    href={localize(link.href)}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center justify-between whitespace-nowrap rounded-control px-4 py-2 text-fl-md font-medium transition-all duration-fl-fast",
                      isActive
                        ? "bg-atelier-ink font-semibold text-atelier-paper"
                        : "text-atelier-ink-2 hover:bg-atelier-paper-2 hover:text-atelier-ink",
                    )}
                  >
                    <span>{label(link)}</span>
                    <span
                      className={cn(
                        "text-fl-xs transition-transform group-hover:translate-x-1",
                        isActive ? "text-atelier-paper/70" : "text-atelier-ink-3",
                      )}
                    >
                      ➔
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-fl-2xs border-t border-atelier-rule/70 pt-fl-xs">
          {isAuthenticated ? (
            <>
              <div className="rounded-control border border-atelier-rule bg-atelier-paper-2 p-fl-xs">
                <p className="fl-label text-[0.62rem] uppercase text-atelier-ink-3">
                  Tài khoản
                </p>
                <p className="truncate text-fl-sm font-medium text-atelier-ink">
                  {user?.email}
                </p>
              </div>
              <Link
                href={localize("/profile")}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center whitespace-nowrap text-fl-sm font-medium text-atelier-ink hover:text-atelier-accent"
              >
                {t.headerAccount}
              </Link>
              {userRole === "ADMIN" ? (
                <Link
                  href={localize("/admin")}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center justify-between whitespace-nowrap text-fl-sm font-medium text-atelier-ink hover:text-atelier-accent"
                >
                  <span>Admin</span>
                  <span className="rounded-control bg-atelier-accent/10 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase text-atelier-accent">
                    Admin
                  </span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-11 items-center whitespace-nowrap text-left text-fl-sm font-medium text-atelier-danger"
              >
                {t.headerLogout}
              </button>
            </>
          ) : (
            <Link
              href={localize("/login")}
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-md text-fl-sm font-semibold text-atelier-accent-ink transition-colors hover:bg-atelier-accent-hover"
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
            className="min-h-11 rounded-control border border-atelier-rule bg-atelier-paper-2 px-3.5 py-1.5 text-fl-2xs font-semibold uppercase tracking-wider text-atelier-ink transition-all hover:bg-atelier-paper-3"
          >
            {language === "vi" ? "ENGLISH 🇬🇧" : "TIẾNG VIỆT 🇻🇳"}
          </button>
        </div>
      </MobileSheet>
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
    <div className="flex h-full flex-col justify-between rounded-surface border border-atelier-rule bg-atelier-paper-2/70 p-fl-md transition-colors hover:border-atelier-rule-strong">
      <div className="flex flex-col gap-fl-xs">
        <span className="fl-label text-[0.62rem] tracking-[0.18em] text-atelier-accent uppercase font-semibold">
          Editorial Highlight
        </span>
        <h3 className="font-serif text-fl-xl font-medium leading-snug text-atelier-ink">{title}</h3>
        <p className="fl-measure-tight text-fl-sm text-atelier-ink-2 leading-relaxed">{body}</p>
      </div>
      <div className="mt-fl-md pt-fl-xs border-t border-atelier-rule/60">
        <TypographicLink href={href} onClick={onNavigate} className="text-fl-sm font-medium text-atelier-ink hover:text-atelier-accent">
          {cta}
        </TypographicLink>
      </div>
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
      <div className="col-span-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-fl-xs">
            <span className="fl-label">{t.headerColourPanelTitle}</span>
            <span className="h-px flex-1 bg-atelier-rule" />
          </div>
          <p className="fl-measure mt-fl-2xs text-fl-sm text-atelier-ink-2">
            {t.headerColourPanelNote}
          </p>
          <ul className="mt-fl-md grid grid-cols-3 gap-x-fl-md gap-y-fl-3xs">
            {COLOR_FAMILIES.map((family) => (
              <li key={family.value} className="group border-b border-atelier-rule/70 transition-colors hover:border-atelier-accent">
                <Link
                  href={localize(`/colors?family=${family.value}`)}
                  onClick={onNavigate}
                  className="flex min-h-11 items-center gap-fl-xs whitespace-nowrap text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out group-hover:text-atelier-accent"
                >
                  <ColorSwatch
                    color={family.swatch}
                    className="fl-swatch h-5 w-5 shrink-0 rounded-swatch border border-black/10 transition-transform duration-fl-fast group-hover:scale-105"
                  />
                  <span className="font-medium">{t[family.labelKey]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <TypographicLink
          href={localize("/colors")}
          onClick={onNavigate}
          className="mt-fl-md self-start"
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
      <div className="col-span-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-fl-xs">
            <span className="fl-label">{t.headerProductPanelTitle}</span>
            <span className="h-px flex-1 bg-atelier-rule" />
          </div>
          <p className="fl-measure mt-fl-2xs text-fl-sm text-atelier-ink-2">
            {t.headerProductPanelNote}
          </p>
          <ul className="mt-fl-md grid grid-cols-2 gap-x-fl-lg gap-y-fl-2xs">
            {PRODUCT_CATEGORIES.map((category) => (
              <li key={category.slug} className="group border-b border-atelier-rule/70 transition-colors hover:border-atelier-accent">
                <Link
                  href={localize(`/products?category=${category.slug}`)}
                  onClick={onNavigate}
                  className="flex min-h-11 items-center justify-between whitespace-nowrap text-fl-sm text-atelier-ink transition-colors duration-fl-fast group-hover:text-atelier-accent"
                >
                  <span className="font-medium">{t[category.labelKey]}</span>
                  <span className="text-fl-xs opacity-0 transition-opacity group-hover:opacity-100 text-atelier-accent">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <TypographicLink
          href={localize("/products")}
          onClick={onNavigate}
          className="mt-fl-md self-start"
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
