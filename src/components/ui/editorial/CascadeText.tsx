/* M1 — per-letter cascade. Letters are aria-hidden; screen readers and SEO
   read the sr-only sentence. `\n` in `text` becomes a <br>. CSS drives the
   55ms/letter delays (globals.css caps at 28 letter spans). */

export function CascadeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden="true" className="fl-letters">
        {Array.from(text).map((ch, i) =>
          ch === "\n" ? (
            <br key={i} />
          ) : (
            <span key={i}>{ch === " " ? " " : ch}</span>
          ),
        )}
      </span>
    </span>
  );
}
