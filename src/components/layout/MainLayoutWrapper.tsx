"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Helper component that runs the observer only when the new page layout mounts
function ScrollRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let observer: IntersectionObserver | null = null;
    let observedElements: NodeListOf<Element> | null = null;

    // Wait 50ms to ensure the page children are fully mounted and rendered in the DOM
    const timer = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: "0px 0px -10% 0px", // Trigger when element is 10% from the bottom of viewport
        threshold: 0.05,
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            // Stop observing once animated in to keep it active
            observer?.unobserve(entry.target);
          }
        });
      }, observerOptions);

      observedElements = document.querySelectorAll(".scroll-reveal");
      observedElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If the element is already in the viewport (or above the fold) on mount, activate it immediately
        if (rect.top < window.innerHeight) {
          el.classList.add("active");
        } else {
          observer?.observe(el);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer && observedElements) {
        observedElements.forEach((el) => observer?.unobserve(el));
      }
    };
  }, [pathname]);

  return null;
}

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHomepage = pathname === "/";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Apply transitions and scroll reveals ONLY to the homepage
  if (!isHomepage) {
    return <main className={isAdmin ? "flex-grow pt-0" : "flex-grow pt-24 pb-20"}>{children}</main>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex-grow pt-24 pb-20"
      >
        <ScrollRevealObserver />
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

