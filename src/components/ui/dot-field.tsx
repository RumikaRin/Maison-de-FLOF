"use client";

/* Adapted from React Bits <DotField /> (MIT). Changes for this codebase:
   - No JSX style props (production CSP: style-src-attr 'none'; see
     tests/no-inline-style.test.ts). Static layout via Tailwind classes;
     runtime writes (canvas CSS size, glow opacity) go through CSSOM.
   - Math.random() gradient id → useId() (SSR-stable).
   - rAF runs only while the host is on screen and the tab is visible;
     prefers-reduced-motion paints one static frame and never animates.
   - Decorative only: aria-hidden, pointer-events-none. */

import { memo, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

const TWO_PI = Math.PI * 2;

type Dot = {
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
};

export const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 220,
  bulgeStrength = 44,
  glowRadius = 0,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(242, 239, 232, 0.16)",
  gradientTo = "rgba(242, 239, 232, 0.07)",
  glowColor = "rgba(28, 22, 19, 0.6)",
  className,
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const propsRef = useRef({
    dotRadius,
    dotSpacing,
    cursorRadius,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  });
  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const canvasElement: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;
    const host: HTMLElement = canvas.parentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const glowEl = glowRef.current;

    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let offsetX = 0;
    let offsetY = 0;
    let raf = 0;
    let frame = 0;
    let visible = false;
    let running = false;
    let glowOpacity = 0;
    let engagement = 0;
    const mouse = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      speed: 0,
    };
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    function buildDots() {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      dots = new Array(rows * cols);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ax = padX + c * step + step / 2;
          const ay = padY + r * step + step / 2;
          dots[i++] = {
            ax,
            ay,
            sx: ax,
            sy: ay,
            vx: 0,
            vy: 0,
            x: ax,
            y: ay,
          };
        }
      }
    }

    function doResize() {
      const rect = host.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvasElement.width = w * dpr;
      canvasElement.height = h * dpr;
      canvasElement.style.width = `${w}px`;
      canvasElement.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      offsetX = rect.left + window.scrollX;
      offsetY = rect.top + window.scrollY;
      buildDots();
      if (reduced) paint();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 120);
    }

    function onMouseMove(event: MouseEvent) {
      mouse.x = event.pageX - offsetX;
      mouse.y = event.pageY - offsetY;
      if (!running && visible && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    function paint() {
      const p = propsRef.current;
      context.clearRect(0, 0, w, h);
      const gradient = context.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, p.gradientFrom);
      gradient.addColorStop(1, p.gradientTo);
      context.fillStyle = gradient;
      const radius = p.dotRadius / 2;
      context.beginPath();
      const time = frame * 0.02;
      const cursorRadiusSquared = p.cursorRadius * p.cursorRadius;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < cursorRadiusSquared && engagement > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          const falloff = 1 - distance / p.cursorRadius;
          const push = falloff * falloff * p.bulgeStrength * engagement;
          const angle = Math.atan2(dy, dx);
          dot.sx +=
            (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
          dot.sy +=
            (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
        } else {
          dot.sx += (dot.ax - dot.sx) * 0.1;
          dot.sy += (dot.ay - dot.sy) * 0.1;
        }
        let drawX = dot.sx;
        let drawY = dot.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * p.waveAmplitude;
          drawX +=
            Math.cos(dot.ay * 0.03 + time * 0.7) *
            p.waveAmplitude *
            0.5;
        }
        let drawRadius = radius;
        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frame >> 3)) >>> 0;
          if (hash % 100 < 3) drawRadius = radius * 1.8;
        }
        context.moveTo(drawX + drawRadius, drawY);
        context.arc(drawX, drawY, drawRadius, 0, TWO_PI);
      }
      context.fill();
    }

    function updateMouseSpeed() {
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      mouse.speed +=
        (Math.sqrt(dx * dx + dy * dy) - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    }
    const speedInterval = reduced
      ? undefined
      : setInterval(updateMouseSpeed, 20);

    function tick() {
      frame++;
      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      glowOpacity += (engagement - glowOpacity) * 0.08;
      if (glowEl) {
        glowEl.setAttribute("cx", String(mouse.x));
        glowEl.setAttribute("cy", String(mouse.y));
        glowEl.style.opacity = String(glowOpacity);
      }
      paint();
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !running && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    });
    observer.observe(host);

    const onVisibility = () => {
      if (!document.hidden && visible && !running && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    doResize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduced) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      if (speedInterval) clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {glowRadius > 0 ? (
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id={gradientId}>
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            ref={glowRef}
            cx="-9999"
            cy="-9999"
            r={glowRadius}
            fill={`url(#${gradientId})`}
            className="opacity-0 will-change-[opacity]"
          />
        </svg>
      ) : null}
    </div>
  );
});
