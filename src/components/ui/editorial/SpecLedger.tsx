import * as React from "react";

import { cn } from "@/lib/utils";

export type SpecRow = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export type SpecLedgerProps = React.HTMLAttributes<HTMLDListElement> & {
  rows: SpecRow[];
  /** Four columns on desktop; collapses to two on tablet, one on phone. */
  columns?: 2 | 4;
};

/**
 * A flat key/value ledger — the replacement for badge clusters and pill rows.
 * Hairline rules, tabular figures, no boxes. See design.md § Notes: turning
 * every piece of metadata into a badge is one of the tells this system exists
 * to remove.
 *
 * It presents data the page already has. It is not a new source of product
 * facts, and it never carries an invented metric.
 */
export function SpecLedger({ rows, columns = 4, className, ...props }: SpecLedgerProps) {
  if (rows.length === 0) return null;

  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-8 border-t border-atelier-rule sm:grid-cols-2",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
      {...props}
    >
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-1 border-b border-atelier-rule py-4"
        >
          <dt className="fl-label">{row.label}</dt>
          <dd className="text-fl-sm tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
