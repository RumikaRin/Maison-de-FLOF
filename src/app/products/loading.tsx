export default function ProductsLoading() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none py-fl-xl">
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-fl-xs">
          <div className="h-4 w-28 rounded bg-atelier-paper-2" />
          <div className="h-10 w-64 rounded bg-atelier-paper-2" />
          <div className="h-4 w-96 rounded bg-atelier-paper-2" />
        </div>

        {/* Filter bar Skeleton */}
        <div className="mt-fl-lg flex gap-fl-xs overflow-hidden border-y border-atelier-rule py-fl-sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-28 shrink-0 rounded bg-atelier-paper-2" />
          ))}
        </div>

        {/* Product Grid Skeleton */}
        <div className="mt-fl-xl grid grid-cols-1 gap-fl-lg sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-fl-sm rounded-surface border border-atelier-rule p-fl-sm bg-atelier-paper-2">
              <div className="aspect-[4/3] w-full rounded bg-atelier-paper-3" />
              <div className="h-4 w-20 rounded bg-atelier-paper-3" />
              <div className="h-6 w-3/4 rounded bg-atelier-paper-3" />
              <div className="h-5 w-1/3 rounded bg-atelier-paper-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
