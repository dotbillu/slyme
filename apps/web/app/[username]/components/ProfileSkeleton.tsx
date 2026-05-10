export default function ProfileSkeleton() {
  return (
    <div className="w-full min-h-screen bg-black text-white pb-20">
      {/* Cover image skeleton */}
      <div className="h-56 w-full bg-zinc-900 animate-pulse" />

      <div className="max-w-2xl mx-auto px-6">
        <div className="-mt-10 mb-8 relative">
          <div className="flex justify-between items-start">
            {/* Avatar skeleton */}
            <div className="w-20 h-20 rounded-full bg-zinc-800 ring-4 ring-black animate-pulse mb-3 shrink-0" />
          </div>

          {/* Name and bio skeleton */}
          <div className="mt-2 space-y-3">
            <div className="h-6 bg-zinc-800 rounded-md w-1/3 animate-pulse" />
            <div className="space-y-2 mt-2">
              <div className="h-4 bg-zinc-800 rounded-md w-2/3 animate-pulse" />
              <div className="h-4 bg-zinc-800 rounded-md w-1/2 animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="mt-5">
            <div className="h-3 bg-zinc-800 rounded-md w-1/4 animate-pulse" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-6 text-sm mb-6 border-b border-zinc-900 pb-2">
          <div className="h-4 bg-zinc-800 rounded-md w-12 animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded-md w-10 animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded-md w-14 animate-pulse" />
        </div>

        {/* Tab content skeleton (Recent) */}
        <div className="space-y-5 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-zinc-800 rounded-md w-1/4 animate-pulse" />
              <div className="h-4 bg-zinc-800 rounded-md w-3/4 animate-pulse" />
              <div className="h-3 bg-zinc-800 rounded-md w-1/6 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
