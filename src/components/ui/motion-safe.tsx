"use client";

import {
  createElement,
  forwardRef,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type JSX,
  type ReactNode,
} from "react";

/**
 * Native hook to detect reduced motion preference.
 * Defaults to false during SSR and initial render, updates on client mount and changes.
 */
export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, []);

  return matches;
}

/**
 * Lightweight pass-through wrapper replacing Framer Motion's AnimatePresence.
 */
export interface AnimatePresenceProps {
  children?: ReactNode;
  mode?: "sync" | "wait" | "popLayout" | string;
  initial?: boolean;
  onExitComplete?: () => void;
  [key: string]: unknown;
}

export function AnimatePresence({ children }: AnimatePresenceProps) {
  return <>{children}</>;
}

const RUNTIME_STYLE_PROPS = new Set([
  "animate",
  "custom",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "exit",
  "initial",
  "layout",
  "layoutId",
  "onAnimationComplete",
  "onAnimationStart",
  "style",
  "transition",
  "variants",
  "viewport",
  "whileDrag",
  "whileFocus",
  "whileHover",
  "whileInView",
  "whileTap",
]);

type MotionStrippedProps = {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  variants?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  whileFocus?: unknown;
  whileInView?: unknown;
  whileDrag?: unknown;
  viewport?: unknown;
  layout?: unknown;
  layoutId?: unknown;
  drag?: unknown;
  dragConstraints?: unknown;
  dragElastic?: unknown;
  dragMomentum?: unknown;
  onAnimationComplete?: unknown;
  onAnimationStart?: unknown;
  custom?: unknown;
};

export type SafeMotionProps<T extends ElementType> = Omit<
  ComponentPropsWithRef<T>,
  keyof MotionStrippedProps
> &
  MotionStrippedProps;

function safeElement<T extends keyof JSX.IntrinsicElements>(tag: T) {
  return forwardRef<any, SafeMotionProps<T>>(
    function MotionSafeElement(props, ref) {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
        if (!RUNTIME_STYLE_PROPS.has(key)) {
          safeProps[key] = value;
        }
      }
      return createElement(tag, { ...safeProps, ref });
    },
  );
}

export const safeMotion = {
  article: safeElement("article"),
  aside: safeElement("aside"),
  button: safeElement("button"),
  div: safeElement("div"),
  header: safeElement("header"),
  main: safeElement("main"),
  p: safeElement("p"),
  span: safeElement("span"),
};
