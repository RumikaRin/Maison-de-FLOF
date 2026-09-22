/* M1 — per-letter cascade. Letters are aria-hidden; screen readers and SEO
   read the sr-only sentence. `\n` in `text` becomes a <br>. Words are grouped
   in inline-block whitespace-nowrap containers to prevent awkward mid-word breaks.
   CSS drives the 15ms/letter delays (globals.css caps at 29 letter spans). */

import * as React from "react";
import { cn } from "@/lib/utils";

export function CascadeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  let letterIndex = 0;
  const lines = text.split("\n");

  return (
    <span className={className}>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden="true" className="fl-letters">
        {lines.map((line, lineIdx) => {
          const words = line.split(" ");
          return (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && <br />}
              {words.map((word, wordIdx) => (
                <React.Fragment key={wordIdx}>
                  {wordIdx > 0 && " "}
                  <span className="inline-block whitespace-nowrap">
                    {Array.from(word).map((ch) => {
                      letterIndex += 1;
                      const delayClass = `fl-delay-${Math.min(letterIndex, 29)}`;
                      return (
                        <span
                          key={letterIndex}
                          className={cn("fl-letter", delayClass)}
                        >
                          {ch}
                        </span>
                      );
                    })}
                  </span>
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}
      </span>
    </span>
  );
}
