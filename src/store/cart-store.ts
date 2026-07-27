"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Paint, PaintColor } from "@/types";

export interface CartItem {
  id: string; // Unique identifier for the item (paintId + selectedColor.code if any)
  paint: Paint;
  selectedColor?: PaintColor;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  /** True once the server cart has been merged in for an authenticated user. */
  synced: boolean;
  addItem: (paint: Paint, quantity: number, selectedColor?: PaintColor) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  /** Replace the whole cart (used when the server cart is the source of truth). */
  replaceItems: (items: CartItem[]) => void;
  setSynced: (synced: boolean) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

/** The minimal snapshot the server persists — no denormalised paint payload. */
export function toCartSnapshot(items: CartItem[]) {
  return items.map((item) => ({
    paintId: item.paint.id,
    colorCode: item.selectedColor?.code ?? "",
    quantity: item.quantity,
  }));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      synced: false,
      replaceItems: (items) => set({ items }),
      setSynced: (synced) => set({ synced }),
      addItem: (paint, quantity, selectedColor) => {
        const id = selectedColor ? `${paint.id}-${selectedColor.code}` : paint.id;
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex((item) => item.id === id);

        if (existingItemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          set({
            items: [...currentItems, { id, paint, selectedColor, quantity }],
          });
        }
      },
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.paint.discountPercent && item.paint.discountPercent > 0
            ? item.paint.price * (1 - item.paint.discountPercent / 100)
            : item.paint.price;
          return sum + price * item.quantity;
        }, 0);
      },
      getCartItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "sonvn-cart", // LocalStorage key
      // `synced` is session-derived, never persisted — only the items are.
      partialize: (state) => ({ items: state.items }),
    }
  )
);
