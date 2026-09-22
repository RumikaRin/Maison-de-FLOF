export default function ProductDetailLoading() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none py-fl-2xl">
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-atelier-paper-2" />
          <div className="h-3 w-3 rounded bg-atelier-paper-2" />
          <div className="h-3 w-24 rounded bg-atelier-paper-2" />
          <div className="h-3 w-3 rounded bg-atelier-paper-2" />
          <div className="h-3 w-32 rounded bg-atelier-paper-2" />
        </div>

        {/* Main Product Layout */}
        <div className="mt-fl-lg grid grid-cols-1 gap-fl-xl lg:grid-cols-12">
          {/* Product Gallery Skeleton */}
          <div className="lg:col-span-7 flex flex-col gap-fl-sm">
            <div className="aspect-[4/3] w-full rounded-surface bg-atelier-paper-2" />
            <div className="flex gap-fl-xs">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square w-20 rounded bg-atelier-paper-2" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="lg:col-span-5 flex flex-col gap-fl-md">
            <div className="h-4 w-28 rounded bg-atelier-paper-2" />
            <div className="h-9 w-4/5 rounded bg-atelier-paper-2" />
            <div className="h-7 w-1/3 rounded bg-atelier-paper-2" />
            <div className="h-20 w-full rounded bg-atelier-paper-2" />

            {/* Colors picker placeholder */}
            <div className="flex flex-col gap-2 pt-fl-sm border-t border-atelier-rule">
              <div className="h-4 w-24 rounded bg-atelier-paper-2" />
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-atelier-paper-2" />
                ))}
              </div>
            </div>

            {/* Quantity & CTA */}
            <div className="flex gap-fl-sm pt-fl-md">
              <div className="h-11 w-28 rounded bg-atelier-paper-2" />
              <div className="h-11 flex-1 rounded bg-atelier-paper-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
