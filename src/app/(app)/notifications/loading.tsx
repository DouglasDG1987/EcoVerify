export default function NotificationsLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="skeleton h-4 w-20 rounded-full" />
            <div className="skeleton mt-2 h-4 w-52 rounded-lg" />
            <div className="skeleton mt-2 h-4 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
