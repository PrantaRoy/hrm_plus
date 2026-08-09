export function SectionSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 py-20 sm:px-6">
      <div className="mx-auto h-8 w-64 rounded bg-slate-200" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
