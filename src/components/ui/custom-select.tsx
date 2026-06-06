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
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold bg-white border border-warm-200 text-warm-900 rounded-xl shadow-sm hover:border-warm-300 focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left h-10 transition-all ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                opt.value === value
                  ? "bg-jotun-teal/10 text-jotun-teal font-bold"
                  : "text-warm-800 hover:bg-warm-50"
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
