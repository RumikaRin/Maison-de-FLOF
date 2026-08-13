/* Entrance orchestrator (spec M2–M6, ornaments). Toggles classes only — no
   inline styles. Without this module the page renders fully settled, because
   every from-state in globals.css is gated behind `html.fl-js`.

   The observer is kept alive for the whole session (never unobserved) so
   that if React re-rendering a dynamic `className` prop wipes an
   imperatively-added `is-in`, the class is restored the next time the
   element re-crosses the intersection threshold — IO callbacks fire on
   crossings, not continuously, so a wipe while the element sits statically
   in view is NOT healed. Host components are therefore expected to keep
   their `[data-fl-io]` elements on static className strings. A one-shot
   "observe once then disconnect" approach would leave a wiped cluster
   invisible forever; re-adding the class on each crossing is idempotent
   and cheap. */

export function initFlReveal(): () => void {
  if (typeof window === "undefined") return () => {};
  document.documentElement.classList.add("fl-js");

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>("[data-fl-io]"),
  );
  const settleAll = () => targets.forEach((t) => t.classList.add("is-in"));

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    typeof IntersectionObserver === "undefined"
  ) {
    settleAll();
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !entry.target.classList.contains("is-in")) {
          entry.target.classList.add("is-in");
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((t) => io.observe(t));
  return () => io.disconnect();
}
