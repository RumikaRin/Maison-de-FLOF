import * as React from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder = "Chọn...",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-h-11 w-full items-center justify-between rounded-control border bg-atelier-paper-2 px-3 py-2 text-left text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out md:min-h-10 ${
          isOpen
            ? "border-atelier-accent"
            : "border-atelier-rule-strong hover:border-atelier-ink-3"
        } ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-atelier-ink-3 transition-transform duration-fl-fast ease-fl-out ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* The open panel visibly floats above the page — one of the two places
          design.md allows a shadow. */}
      {isOpen && (
        <div className="fl-panel-in absolute left-0 right-0 z-[100] mt-fl-3xs max-h-60 overflow-y-auto rounded-surface border border-atelier-rule bg-atelier-paper p-fl-3xs shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value);
                setIsOpen(false);
              }}
              className={`flex min-h-11 w-full cursor-pointer items-center rounded-control px-3 py-2 text-left text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-9 ${
                opt.value === value
                  ? "bg-atelier-paper-3 font-medium text-atelier-accent"
                  : "text-atelier-ink hover:bg-atelier-paper-2"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
