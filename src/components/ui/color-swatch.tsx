import { cn } from "@/lib/utils";

function safeHexColor(value: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : "#000000";
}

export function ColorSwatch({
  color,
  className,
  opacity,
}: {
  color: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={cn("overflow-hidden", className)}
    >
      <rect
        width="100"
        height="100"
        fill={safeHexColor(color)}
        opacity={opacity}
      />
    </svg>
  );
}
