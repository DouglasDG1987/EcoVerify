export default function ModerationLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton mt-2 h-4 w-80 rounded-lg" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-5 md:flex-row flex-col">
            <div className="skeleton h-56 w-full rounded-xl md:h-40 md:w-64" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-52 rounded-lg" />
              <div className="skeleton h-4 w-32 rounded-lg" />
              <div className="skeleton h-16 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
