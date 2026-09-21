"use client";

import { useState, useEffect } from "react";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { scrollToTopLenis } from "@/providers/smooth-scroll-provider";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    const handleChatToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      setChatOpen(Boolean(customEvent.detail?.open));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("flof-chat-toggle", handleChatToggle);

    if (typeof document !== "undefined" && document.body.getAttribute("data-chat-open") === "true") {
      setChatOpen(true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("flof-chat-toggle", handleChatToggle);
    };
  }, []);

  const scrollToTop = () => {
    scrollToTopLenis(1.2);
  };

  return (
    <AnimatePresence>
      {visible && !chatOpen && (
        <safeMotion.button
          key="scroll-to-top"
          data-scroll-to-top
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="group fixed bottom-20 right-4 z-20 flex h-11 w-11 cursor-pointer
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



