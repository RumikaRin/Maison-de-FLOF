"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesVnName } from "@/lib/vn-address";

interface AddressSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
}

/**
 * A searchable single-select for Vietnamese administrative units. Option lists
 * run to ~170 wards for the largest city, so a plain dropdown is unusable —
 * the open panel leads with a filter input (diacritic-insensitive, see
 * matchesVnName). A stored legacy value that is no longer in the option list
 * (pre-2025-merger district names on saved addresses) still displays on the
 * trigger rather than silently blanking.
 */
export function AddressSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
}: AddressSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    searchRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filtered = React.useMemo(
    () => options.filter((name) => matchesVnName(name, query)),
    [options, query],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex min-h-11 w-full items-center justify-between rounded-control border bg-atelier-paper-2 px-3 py-2 text-left text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-10",
          disabled
            ? "cursor-not-allowed border-atelier-rule text-atelier-ink-3"
            : isOpen
              ? "border-atelier-accent text-atelier-ink"
              : "border-atelier-rule-strong text-atelier-ink hover:border-atelier-ink-3",
        )}
      >
        <span className={cn("truncate", !value && "text-atelier-ink-2")}>
          {value || placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-atelier-ink-3 transition-transform duration-fl-fast ease-fl-out",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {/* The open panel visibly floats above the page — one of the two places
          design.md allows a shadow. */}
      {isOpen ? (
        <div className="fl-panel-in absolute left-0 right-0 z-[100] mt-fl-3xs rounded-surface border border-atelier-rule bg-atelier-paper shadow-lg">
          <div className="flex items-center gap-fl-2xs border-b border-atelier-rule px-3">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-atelier-ink-3" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-h-11 w-full bg-transparent text-fl-sm text-atelier-ink outline-none placeholder:text-atelier-ink-3 md:min-h-10"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto p-fl-3xs">
            {filtered.length === 0 ? (
              <li className="px-3 py-fl-xs text-fl-sm text-atelier-ink-3">{emptyLabel}</li>
            ) : (
              filtered.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={name === value}
                    onClick={() => {
                      onValueChange(name);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer items-center rounded-control px-3 py-2 text-left text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-9",
                      name === value
                        ? "bg-atelier-paper-3 font-medium text-atelier-accent"
                        : "text-atelier-ink hover:bg-atelier-paper-2",
                    )}
                  >
                    {name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
