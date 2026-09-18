export default function RankingLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-40 rounded-lg" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white px-4 py-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="skeleton h-4 flex-1 rounded-lg" />
            <div className="skeleton h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
