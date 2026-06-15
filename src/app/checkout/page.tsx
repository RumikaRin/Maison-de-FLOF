import { Suspense } from "react";
import { CheckoutClient } from "@/components/features/checkout/CheckoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - Maison de FLOF",
  description: "Secure checkout process.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-6 py-24 text-center">
        <div className="animate-pulse text-muted-foreground font-serif text-lg">Loading checkout...</div>
      </div>
    }>
      <CheckoutClient />
    </Suspense>
  );
}
