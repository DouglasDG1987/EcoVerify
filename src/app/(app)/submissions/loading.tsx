export default function SubmissionsLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-56 rounded-lg" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-4">
            <div className="skeleton h-24 w-24 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-40 rounded-lg" />
              <div className="skeleton h-3 w-24 rounded-lg" />
              <div className="skeleton h-8 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
