export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-4">
          <div className="h-[460px] animate-pulse rounded-[2.2rem] bg-stone-100" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-24 animate-pulse rounded-[1.2rem] bg-stone-100"
                key={`product-thumb-skeleton-${index}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
          <div className="h-12 w-5/6 animate-pulse rounded-full bg-stone-200" />
          <div className="h-3 w-full animate-pulse rounded-full bg-stone-100" />
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-stone-100" />
          <div className="h-10 w-40 animate-pulse rounded-full bg-stone-200" />
          <div className="h-14 w-full animate-pulse rounded-full bg-stone-950/15" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="rounded-[1.6rem] border border-stone-200 bg-white p-5"
                key={`product-meta-skeleton-${index}`}
              >
                <div className="h-3 w-16 animate-pulse rounded-full bg-stone-200" />
                <div className="mt-4 h-8 w-4/5 animate-pulse rounded-full bg-stone-100" />
                <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="soft-panel rounded-[1.8rem] p-6"
            key={`product-section-skeleton-${index}`}
          >
            <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-4 h-10 w-64 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-stone-100" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-stone-100" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
