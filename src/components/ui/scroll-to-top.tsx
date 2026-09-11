"use client";

import { useState, useEffect } from "react";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { scrollToTopLenis } from "@/providers/smooth-scroll-provider";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollToTopLenis(1.2);
  };

  return (
    <AnimatePresence>
      {visible && (
        <safeMotion.button
          key="scroll-to-top"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="group fixed bottom-20 right-4 z-40 flex h-11 w-11 cursor-pointer
                     items-center justify-center rounded-control
                     border border-atelier-rule-strong bg-atelier-espresso text-atelier-on-dark shadow-md
                     transition-colors duration-fl-fast ease-fl-out
                     hover:bg-atelier-ink
                     md:bottom-24 md:right-7 md:h-10 md:w-10"
        >
          <ArrowUp
            className="h-4 w-4 transition-transform duration-fl-fast ease-fl-out group-hover:-translate-y-0.5"
          />
        </safeMotion.button>
      )}
    </AnimatePresence>
  );
}



