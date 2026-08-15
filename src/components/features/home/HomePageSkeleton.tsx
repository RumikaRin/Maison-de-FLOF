/* Hallmark · genre: editorial · section: homepage suspense skeleton · design-system: design.md */

export function HomePageSkeleton() {
  return (
    <div aria-hidden="true" className="w-full bg-atelier-paper animate-pulse pointer-events-none select-none">
      {/* Promotion Section Skeleton */}
      <section className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <div className="grid grid-cols-1 items-start gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
          <div className="aspect-[4/3] w-full rounded-surface bg-atelier-paper-2 lg:col-span-7" />
          <div className="flex flex-col gap-fl-sm lg:col-span-5 lg:mt-fl-2xl lg:pl-fl-xl">
            <div className="h-4 w-24 rounded bg-atelier-paper-2" />
            <div className="h-10 w-3/4 rounded bg-atelier-paper-2" />
            <div className="h-20 w-full rounded bg-atelier-paper-2" />
            <div className="mt-fl-md grid grid-cols-2 gap-fl-sm">
              <div className="h-12 rounded bg-atelier-paper-2" />
              <div className="h-12 rounded bg-atelier-paper-2" />
              <div className="h-12 rounded bg-atelier-paper-2" />
              <div className="h-12 rounded bg-atelier-paper-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Color Explorer Section Skeleton */}
      <section className="border-t border-atelier-rule bg-atelier-paper-2 py-fl-2xl">
        <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">
          <div className="h-4 w-32 rounded bg-atelier-paper" />
          <div className="mt-fl-xs h-8 w-64 rounded bg-atelier-paper" />
          <div className="mt-fl-lg flex gap-fl-xs overflow-hidden">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-12 w-28 shrink-0 rounded bg-atelier-paper" />
            ))}
          </div>
          <div className="mt-fl-lg grid grid-cols-1 gap-fl-lg lg:grid-cols-12">
            <div className="aspect-[4/3] rounded-surface bg-atelier-paper lg:col-span-7" />
            <div className="grid grid-cols-2 gap-fl-sm sm:grid-cols-3 lg:col-span-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded bg-atelier-paper" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section Skeleton */}
      <section className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <div className="h-4 w-28 rounded bg-atelier-paper-2" />
        <div className="mt-fl-xs h-8 w-56 rounded bg-atelier-paper-2" />
        <div className="mt-fl-lg grid grid-cols-1 gap-fl-lg md:grid-cols-12">
          <div className="aspect-[4/3] rounded-surface bg-atelier-paper-2 md:col-span-7" />
          <div className="grid grid-cols-2 gap-fl-md md:col-span-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded bg-atelier-paper-2" />
            ))}
          </div>
        </div>
      </section>

      {/* Expert Journal / Blogs Section Skeleton */}
      <section className="fl-drench-mineral py-fl-3xl md:py-fl-4xl">
        <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">
          <div className="flex flex-col gap-fl-sm sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="h-4 w-28 rounded bg-atelier-paper-2" />
              <div className="mt-fl-xs h-8 w-60 rounded bg-atelier-paper-2" />
            </div>
            <div className="h-4 w-24 rounded bg-atelier-paper-2" />
          </div>

          <div className="mt-fl-lg grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
            <div className="lg:col-span-7">
              <div className="aspect-[16/10] w-full rounded-surface bg-atelier-paper-2" />
              <div className="mt-fl-sm h-4 w-32 rounded bg-atelier-paper-2" />
              <div className="mt-fl-xs h-6 w-3/4 rounded bg-atelier-paper-2" />
              <div className="mt-fl-xs h-10 w-full rounded bg-atelier-paper-2" />
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-atelier-rule lg:pl-fl-lg">
              <div className="flex flex-col gap-fl-md">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-fl-sm py-fl-md border-b border-atelier-rule">
                    <div className="col-span-2 aspect-[4/3] rounded-surface bg-atelier-paper-2" />
                    <div className="col-span-3 flex flex-col justify-center gap-2">
                      <div className="h-3 w-16 rounded bg-atelier-paper-2" />
                      <div className="h-4 w-full rounded bg-atelier-paper-2" />
                      <div className="h-3 w-4/5 rounded bg-atelier-paper-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
