"use client";

import { useState, useEffect } from "react";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <safeMotion.button
          key="scroll-to-top"
          initial={{ opacity: 0, y: 16, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.88 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-24 right-5 z-[60] flex items-center justify-center w-11 h-11 rounded-full
                     sm:bottom-[6.75rem] sm:right-8
                     bg-[#1c1917] hover:bg-[#292524] text-white
                     shadow-[0_4px_20px_rgba(0,0,0,0.18),0_1px_6px_rgba(0,0,0,0.1)]
                     border border-white/10
                     transition-colors duration-300 cursor-pointer
                     group"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.93 }}
        >
          <ArrowUp
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5"
          />
        </safeMotion.button>
      )}
    </AnimatePresence>
  );
}



