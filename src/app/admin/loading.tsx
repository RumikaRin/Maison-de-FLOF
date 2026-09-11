export default function AdminLoading() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none p-6 md:p-8">
      {/* Top action bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-28 rounded bg-atelier-paper-2" />
          <div className="h-8 w-48 rounded bg-atelier-paper-2" />
        </div>
        <div className="h-10 w-32 rounded bg-atelier-paper-2" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-control border border-atelier-rule bg-atelier-paper-2 p-5">
            <div className="h-4 w-24 rounded bg-atelier-paper-3" />
            <div className="h-8 w-32 rounded bg-atelier-paper-3" />
            <div className="h-3 w-20 rounded bg-atelier-paper-3" />
          </div>
        ))}
      </div>

      {/* Main Table/Data Area Skeleton */}
      <div className="mt-8 rounded-control border border-atelier-rule bg-atelier-paper-2 p-6">
        <div className="flex items-center justify-between border-b border-atelier-rule pb-4">
          <div className="h-5 w-36 rounded bg-atelier-paper-3" />
          <div className="h-9 w-64 rounded bg-atelier-paper-3" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-atelier-rule/60 py-3">
              <div className="h-4 w-40 rounded bg-atelier-paper-3" />
              <div className="h-4 w-24 rounded bg-atelier-paper-3" />
              <div className="h-4 w-28 rounded bg-atelier-paper-3" />
              <div className="h-4 w-16 rounded bg-atelier-paper-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
