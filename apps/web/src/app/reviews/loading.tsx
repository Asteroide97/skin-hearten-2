export default function ReviewsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <section className="overflow-hidden rounded-[2.2rem] bg-stone-950 px-5 py-8 text-white sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="space-y-4">
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/20" />
            <div className="h-12 w-80 animate-pulse rounded-full bg-white/15" />
            <div className="h-3 w-full max-w-xl animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/20" />
            <div className="mt-4 h-12 w-28 animate-pulse rounded-full bg-white/15" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </section>

      <section className="soft-panel rounded-[1.8rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-stone-200" />
            <div className="h-10 w-72 animate-pulse rounded-full bg-stone-200" />
            <div className="h-3 w-80 animate-pulse rounded-full bg-stone-100" />
          </div>
          <div className="h-12 w-40 animate-pulse rounded-full bg-stone-200" />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.6fr_auto]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-12 animate-pulse rounded-full bg-stone-100"
              key={`reviews-filter-skeleton-${index}`}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            className="rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-soft"
            key={`review-card-skeleton-${index}`}
          >
            <div className="h-3 w-32 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-4 h-8 w-40 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-stone-100" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-stone-100" />
            <div className="mt-2 h-3 w-4/6 animate-pulse rounded-full bg-stone-100" />
          </article>
        ))}
      </section>
    </div>
  );
}
