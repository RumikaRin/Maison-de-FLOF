/* eslint-disable @next/next/no-img-element */
import { getImageProps, type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export function CspImage({ className, fill, priority, alt, ...input }: ImageProps) {
  const { props } = getImageProps({
    ...input,
    alt,
    fill,
    priority,
  });
  const { style: _generatedInlineStyle, ...imageProps } = props;

  // next/image expresses `fill` through a style attribute. Translate those
  // fixed declarations to classes so production CSP can deny style attributes.
  return (
    <img
      {...imageProps}
      alt={alt}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
