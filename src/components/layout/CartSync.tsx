"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { useCartStore, toCartSnapshot, type CartItem } from "@/store/cart-store";
import { reconcileMergedCart, type KeyedLine } from "@/lib/cart-merge";

type LocalCartItem = ReturnType<typeof useCartStore.getState>["items"][number];

const lineKey = (item: LocalCartItem): string =>
  `${item.paint.id} ${item.selectedColor?.code ?? ""}`;

const toKeyed = (items: LocalCartItem[]): KeyedLine<LocalCartItem>[] =>
  items.map((item) => ({ key: lineKey(item), quantity: item.quantity, item }));

/**
 * Multi-device cart sync. Mounted once in the root layout; renders nothing.
 *
 * - On sign-in, the guest's local cart is merged into the server cart (union of
 *   quantities), and the merged result becomes the local cart — so a customer
 *   who added items on their phone still sees them after logging in on desktop.
 * - While authenticated, every change is pushed to the server, debounced, so the
 *   next device loads an up-to-date cart.
 * - On sign-out the local cart is left untouched (the guest keeps browsing).
 */
export function CartSync() {
  const { status } = useSession();
  const replaceItems = useCartStore((s) => s.replaceItems);
  const setSynced = useCartStore((s) => s.setSynced);
  const synced = useCartStore((s) => s.synced);

  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merge on sign-in (runs once per authenticated session).
  useEffect(() => {
    if (status !== "authenticated" || synced) return;
    let cancelled = false;

    (async () => {
      try {
        const requestItems = useCartStore.getState().items;
        const response = await fetch("/api/cart/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: toCartSnapshot(requestItems) }),
        });
        if (!response.ok) throw new Error("merge failed");
        const { data } = (await response.json()) as { data: CartItem[] };
        if (cancelled) return;

        const serverItems: LocalCartItem[] = data.map((item) => ({
          id: item.id,
          paint: item.paint,
          selectedColor: item.selectedColor ?? undefined,
          quantity: item.quantity,
        }));

        // Anything added or removed while the merge round-trip was in flight
        // must survive adoption — blindly replacing with the server result
        // would wipe an item added right after sign-in ("Mua ngay" race).
        const currentItems = useCartStore.getState().items;
        const mutatedInFlight = currentItems !== requestItems;
        const adopted = mutatedInFlight
          ? reconcileMergedCart(
              toKeyed(serverItems),
              toKeyed(requestItems),
              toKeyed(currentItems),
            ).map(({ item, quantity }) => ({ ...item, quantity }))
          : serverItems;

        replaceItems(adopted);
        setSynced(true);

        if (mutatedInFlight) {
          // The server does not know about the in-flight delta yet.
          void fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: toCartSnapshot(adopted) }),
          }).catch(() => {
            /* transient; the next change re-pushes */
          });
        }
      } catch {
        // Offline or transient: keep the local cart, retry on the next change.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, synced, replaceItems, setSynced]);

  // Reset the synced flag when the session ends so the next login re-merges.
  useEffect(() => {
    if (status === "unauthenticated") setSynced(false);
  }, [status, setSynced]);

  // Debounced push of every change while authenticated and synced.
  useEffect(() => {
    if (status !== "authenticated" || !synced) return;

    // No suppress flag: this subscription only attaches after `synced` flips
    // true, i.e. after the merge's replaceItems already ran — a flag armed
    // before that would swallow the user's first real change instead.
    const unsubscribe = useCartStore.subscribe((state, prev) => {
      if (state.items === prev.items) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        void fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: toCartSnapshot(useCartStore.getState().items) }),
        }).catch(() => {
          /* transient; the next change re-pushes */
        });
      }, 600);
    });

    return () => {
      unsubscribe();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [status, synced]);

  return null;
}
