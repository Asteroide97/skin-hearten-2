export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
        <div className="h-10 w-72 animate-pulse rounded-full bg-stone-200" />
        <div className="h-3 w-full max-w-3xl animate-pulse rounded-full bg-stone-100" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="soft-panel rounded-[1.8rem] p-6">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`filter-skeleton-${index}`} className="space-y-3">
                <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
                <div className="h-12 animate-pulse rounded-[1.2rem] bg-stone-100" />
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="soft-panel rounded-[1.8rem] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <div className="h-3 w-20 animate-pulse rounded-full bg-stone-200" />
                <div className="h-10 w-80 animate-pulse rounded-full bg-stone-200" />
                <div className="h-3 w-52 animate-pulse rounded-full bg-stone-100" />
              </div>
              <div className="grid w-full gap-4 sm:max-w-[520px] sm:grid-cols-2">
                <div className="h-12 animate-pulse rounded-[1.2rem] bg-stone-100" />
                <div className="h-12 animate-pulse rounded-[1.2rem] bg-stone-100" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article
                className="soft-panel rounded-[1.8rem] p-5"
                key={`product-card-skeleton-${index}`}
              >
                <div className="h-64 animate-pulse rounded-[1.6rem] bg-stone-100" />
                <div className="mt-5 h-3 w-20 animate-pulse rounded-full bg-stone-100" />
                <div className="mt-3 h-8 w-4/5 animate-pulse rounded-full bg-stone-200" />
                <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-stone-100" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-stone-100" />
                <div className="mt-5 h-11 animate-pulse rounded-full bg-stone-200" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
