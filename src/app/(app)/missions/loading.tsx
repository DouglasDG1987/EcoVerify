export default function MissionsLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-40 rounded-lg" />
      <div className="skeleton mt-2 h-4 w-72 rounded-lg" />
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="skeleton h-16 w-16 rounded-2xl" />
            <div className="skeleton mt-4 h-4 w-24 rounded-full" />
            <div className="skeleton mt-2 h-5 w-40 rounded-lg" />
            <div className="skeleton mt-2 h-10 w-full rounded-lg" />
            <div className="skeleton mt-4 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
