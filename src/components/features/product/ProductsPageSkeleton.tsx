/* Hallmark · genre: editorial · section: products page skeleton · design-system: design.md */

export function ProductsPageSkeleton() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none text-atelier-ink">
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-lg">
        {/* Header */}
        <div className="h-4 w-28 rounded bg-atelier-paper-2" />
        <div className="mt-fl-xs h-10 w-64 rounded bg-atelier-paper-2" />
        <div className="mt-fl-sm h-4 w-96 max-w-full rounded bg-atelier-paper-2" />

        <div className="mt-fl-lg h-px w-full bg-atelier-rule-strong" />

        {/* Filter Toolbar desktop */}
        <div className="mt-fl-lg hidden md:flex flex-wrap items-center justify-between gap-fl-md">
          <div className="flex flex-wrap items-center gap-fl-xs">
            <div className="h-10 w-48 rounded bg-atelier-paper-2" />
            <div className="h-10 w-32 rounded bg-atelier-paper-2" />
            <div className="h-10 w-32 rounded bg-atelier-paper-2" />
          </div>
          <div className="h-10 w-36 rounded bg-atelier-paper-2" />
        </div>

        {/* Product Grid */}
        <div className="mt-fl-xl grid grid-cols-1 gap-x-fl-lg gap-y-fl-xl sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-fl-xs">
              <div className="aspect-[4/3] w-full rounded-surface bg-atelier-paper-2" />
              <div className="h-3 w-20 rounded bg-atelier-paper-2" />
              <div className="h-5 w-4/5 rounded bg-atelier-paper-2" />
              <div className="mt-auto flex items-center justify-between pt-fl-xs border-t border-atelier-rule">
                <div className="h-4 w-24 rounded bg-atelier-paper-2" />
                <div className="h-4 w-16 rounded bg-atelier-paper-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
