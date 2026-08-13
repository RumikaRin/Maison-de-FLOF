/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome)
 * mobile-nav: 5-tab sticky bottom bar with safe-area padding & cart counter badge
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Package,
  Palette,
  Sparkles,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useLocaleNavigation } from "@/hooks/use-locale-navigation";
import { getMobileSurfacePolicy } from "@/lib/mobile-surface-policy";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  labelVi: string;
  labelEn: string;
  icon: LucideIcon;
  isCart?: boolean;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/", labelVi: "Trang chủ", labelEn: "Home", icon: Home },
  { href: "/products", labelVi: "Sản phẩm", labelEn: "Products", icon: Package },
  { href: "/colors", labelVi: "Bảng màu", labelEn: "Colors", icon: Palette },
  { href: "/color-visualizer", labelVi: "Phối màu", labelEn: "Visualizer", icon: Sparkles },
  { href: "/cart", labelVi: "Giỏ hàng", labelEn: "Cart", icon: ShoppingCart, isCart: true },
];

export function MobileBottomBar() {
  const { language, routePath, localize } = useLocaleNavigation();
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const policy = getMobileSurfacePolicy(routePath);

  useEffect(() => {
    setMounted(true);
    setCartCount(getCartItemCount());
    const unsubscribe = useCartStore.subscribe((state) => {
      setCartCount(state.getCartItemCount());
    });
    return () => unsubscribe();
  }, [getCartItemCount]);

  if (!policy.bottomNavigation) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-atelier-rule bg-atelier-paper/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgb(43_35_30_/_0.08)] backdrop-blur-md md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const href = localize(item.href);
          const isActive =
            item.href === "/"
              ? routePath === "/" || routePath === ""
              : routePath.startsWith(item.href);
          const Icon = item.icon;
          const label = language === "en" ? item.labelEn : item.labelVi;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "relative flex h-full min-h-11 flex-1 flex-col items-center justify-center rounded-control py-1 text-center transition-colors",
                isActive
                  ? "font-semibold text-atelier-accent"
                  : "text-atelier-ink-2 hover:text-atelier-ink",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-fl-fast",
                    isActive && "scale-110",
                  )}
                />
                {item.isCart && mounted && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-control bg-atelier-accent px-1 text-[10px] font-bold text-atelier-accent-ink shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="mt-1 max-w-[64px] truncate text-[11px] leading-tight tracking-tight">
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 h-[2.5px] w-8 rounded-control bg-atelier-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
