import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Atelier Editorial button. See design.md § CTA voice.
 *
 * - `default` is the one solid action per viewport. No gradient, no shadow, no pill.
 * - `link` is the C3 typographic secondary action: word, arrow, 1px underline.
 * - `outline` is the C1 outlined chip, rectangular, hairline border.
 * - Inside a `.fl-drench` band the surface flips to the band's own ink, because
 *   teal is invisible on a drench.
 *
 * Eight states ship on every variant: default, hover, focus-visible, active,
 * disabled, loading, error, success. The last three are driven by `data-state`
 * so call sites can stay declarative without new props.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control",
    "text-fl-sm font-medium",
    "transition-colors duration-fl-fast ease-fl-out",
    "disabled:pointer-events-none disabled:opacity-45",
    "data-[state=loading]:pointer-events-none data-[state=loading]:opacity-70",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-atelier-accent text-atelier-accent-ink",
          "hover:bg-atelier-accent-hover active:bg-atelier-accent-hover",
          "data-[state=error]:bg-atelier-danger data-[state=success]:bg-atelier-success",
          // Teal is invisible on a drench band — flip to the band's light ink.
          "[.fl-drench_&]:bg-atelier-on-dark [.fl-drench_&]:text-atelier-espresso",
          "[.fl-drench_&]:hover:bg-atelier-paper-2",
        ],
        destructive: "bg-atelier-danger text-atelier-accent-ink hover:brightness-90 active:brightness-85",
        outline: [
          "border border-atelier-rule-strong bg-transparent text-atelier-ink",
          "hover:bg-atelier-paper-2 active:bg-atelier-paper-3",
          "data-[state=error]:border-atelier-danger data-[state=error]:text-atelier-danger",
        ],
        secondary: "bg-atelier-paper-2 text-atelier-ink hover:bg-atelier-paper-3 active:bg-atelier-paper-3",
        ghost: "text-atelier-ink hover:bg-atelier-paper-2 active:bg-atelier-paper-3",
        link: [
          "px-0 text-atelier-accent underline decoration-1 underline-offset-4",
          "hover:decoration-2 active:opacity-80",
          "[.fl-drench_&]:text-current",
        ],
      },
      size: {
        // 44px min on touch targets, per design.md § Accessibility floor.
        default: "min-h-11 px-6 py-2.5 md:min-h-10",
        sm: "min-h-11 px-4 py-2 text-fl-xs md:min-h-9",
        lg: "min-h-12 px-8 py-3 text-fl-md",
        icon: "h-11 w-11 md:h-10 md:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
