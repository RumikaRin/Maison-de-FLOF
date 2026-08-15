/* Hallmark · genre: editorial · section: colors page skeleton · design-system: design.md */

export function ColorsPageSkeleton() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none text-atelier-ink">
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-lg">
        {/* Header */}
        <div className="h-4 w-28 rounded bg-atelier-paper-2" />
        <div className="mt-fl-xs h-10 w-64 rounded bg-atelier-paper-2" />
        <div className="mt-fl-sm h-4 w-96 max-w-full rounded bg-atelier-paper-2" />

        <div className="mt-fl-lg h-px w-full bg-atelier-rule-strong" />

        {/* Filter Palette Chips */}
        <div className="mt-fl-lg flex gap-fl-xs overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 w-24 shrink-0 rounded bg-atelier-paper-2" />
          ))}
        </div>

        {/* Swatch Grid */}
        <div className="mt-fl-xl grid grid-cols-2 gap-fl-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-fl-2xs border-b border-atelier-rule pb-fl-sm">
              <div className="h-24 w-full rounded-swatch bg-atelier-paper-2" />
              <div className="h-4 w-3/4 rounded bg-atelier-paper-2" />
              <div className="h-3 w-1/2 rounded bg-atelier-paper-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
