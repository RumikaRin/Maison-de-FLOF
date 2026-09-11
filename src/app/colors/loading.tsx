export default function ColorsLoading() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none py-fl-xl">
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-fl-xs">
          <div className="h-4 w-32 rounded bg-atelier-paper-2" />
          <div className="h-10 w-72 rounded bg-atelier-paper-2" />
          <div className="h-4 w-full max-w-lg rounded bg-atelier-paper-2" />
        </div>

        {/* Filter controls Skeleton */}
        <div className="mt-fl-lg grid grid-cols-1 gap-fl-sm sm:grid-cols-3 border-y border-atelier-rule py-fl-md">
          <div className="h-10 rounded bg-atelier-paper-2" />
          <div className="h-10 rounded bg-atelier-paper-2" />
          <div className="h-10 rounded bg-atelier-paper-2" />
        </div>

        {/* Swatches Grid Skeleton */}
        <div className="mt-fl-xl grid grid-cols-2 gap-fl-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-surface border border-atelier-rule p-2 bg-atelier-paper-2">
              <div className="aspect-[4/3] w-full rounded bg-atelier-paper-3" />
              <div className="h-4 w-3/4 rounded bg-atelier-paper-3" />
              <div className="h-3 w-1/2 rounded bg-atelier-paper-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
