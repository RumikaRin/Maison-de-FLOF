/* Slice-drift runtime (spec M10). Pure math is exported for unit tests; the
   DOM part writes exactly one custom property per plate via CSSOM, which the
   production CSP permits (style-src-attr blocks parsed attributes, not CSSOM). */

export function clampVelocity(deltaPx: number, maxPx = 60): number {
  return Math.max(-1, Math.min(1, deltaPx / maxPx));
}

export function decayVelocity(
  current: number,
  target: number,
  lerp = 0.14,
  epsilon = 0.001,
): number {
  const next = current + (target - current) * lerp;
  return Math.abs(next) < epsilon && Math.abs(target) < epsilon ? 0 : next;
}

export function initFlSlice(): () => void {
  if (typeof window === "undefined") return () => {};
  const plates = Array.from(
    document.querySelectorAll<HTMLElement>("[data-fl-slice]"),
  );
  if (!plates.length) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const visible = new Set<HTMLElement>();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.add(el);
      else {
        visible.delete(el);
        el.style.setProperty("--fl-slice-v", "0");
      }
    }
  });
  plates.forEach((plate) => io.observe(plate));

  let lastY = window.scrollY;
  let value = 0;
  let target = 0;
  let raf = 0;
  let running = false;

  const step = () => {
    value = decayVelocity(value, target);
    target *= 0.82;
    for (const plate of visible) {
      plate.style.setProperty("--fl-slice-v", value.toFixed(4));
    }
    if (value === 0 && Math.abs(target) < 0.001) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(step);
  };

  const onScroll = () => {
    const y = window.scrollY;
    target = clampVelocity(y - lastY);
    lastY = y;
    if (!running && visible.size) {
      running = true;
      raf = requestAnimationFrame(step);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}
