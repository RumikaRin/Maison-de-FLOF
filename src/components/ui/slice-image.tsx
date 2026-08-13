import { CspImage } from "@/components/ui/csp-image";
import { cn } from "@/lib/utils";

const STRIPS = [0, 1, 2, 3];

/* M10 — one photo as 4 vertical strips. Strip geometry and drift amplitudes
   live in globals.css (nth-child rules); fl-slice.ts drives --fl-slice-v.
   Never combine with parallax/curtain/hover-zoom — one strong idea per plate. */
export function SliceImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={alt}
      data-fl-slice
      data-fl-io
      className={cn("fl-slice absolute inset-0", className)}
    >
      {STRIPS.map((k) => (
        <span key={k} aria-hidden="true" className="fl-slice-strip">
          <CspImage
            src={src}
            alt=""
            fill
            sizes={sizes}
            className="fl-slice-img object-cover"
          />
        </span>
      ))}
    </span>
  );
}
