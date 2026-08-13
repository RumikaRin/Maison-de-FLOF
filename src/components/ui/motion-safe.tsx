"use client";

import { createElement, forwardRef } from "react";
import type { motion as FramerMotion } from "framer-motion";

export {
  AnimatePresence,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

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

function safeElement(tag: string) {
  return forwardRef<HTMLElement, Record<string, unknown>>(
    function MotionSafeElement(props, ref) {
      const safeProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !RUNTIME_STYLE_PROPS.has(key)),
      );
      return createElement(tag, { ...safeProps, ref });
    },
  );
}

export const safeMotion = {
  article: safeElement("article") as typeof FramerMotion.article,
  aside: safeElement("aside") as typeof FramerMotion.aside,
  button: safeElement("button") as typeof FramerMotion.button,
  div: safeElement("div") as typeof FramerMotion.div,
  header: safeElement("header") as typeof FramerMotion.header,
  main: safeElement("main") as typeof FramerMotion.main,
  p: safeElement("p") as typeof FramerMotion.p,
  span: safeElement("span") as typeof FramerMotion.span,
};

