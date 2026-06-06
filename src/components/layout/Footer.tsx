"use client";

import { usePathname } from "next/navigation";
import { Footerdemo } from "@/components/ui/footer-section";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="block">
      <Footerdemo />
    </div>
  );
}
