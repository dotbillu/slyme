"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPublic } from "@/types/user";
import { MapPin, Calendar, Award, Tag } from "lucide-react";

type Tab = "recent" | "gigs" | "rooms";

function formatDate(d: Date | string | null) {
  if (!d) return "no date";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function GigCard({ gig, onClick }: { gig: UserPublic["gigs"][number]; onClick: () => void }) {
  return (
    <div onClick={onClick} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition space-y-3 cursor-pointer">
      {/* Image */}
      {gig.imageUrls.length > 0 && (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-zinc-800">
          <img src={gig.imageUrls[0]} alt={gig.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-white leading-tight">{gig.title}</h3>
        {gig.type && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {gig.type}
          </span>
        )}
      </div>

      {/* Description */}
      {gig.description && (
        <p className="text-xs text-zinc-500 line-clamp-2">{gig.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        {gig.reward && (
          <span className="flex items-center gap-1">
            <Award size={11} className="text-green-400" />
            {gig.reward}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={11} className="text-blue-400" />
          {formatDate(gig.date)}
        </span>
      </div>
    </div>
  );
}

export default function ProfileClient({ user }: { user: UserPublic }) {
  const [tab, setTab] = useState<Tab>("recent");
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-black text-white">
      <div className="h-56 w-full bg-zinc-900 overflow-hidden">
        {user.coverImageUrl && (
          <img
            src={user.coverImageUrl}
            className="w-full h-full object-cover opacity-80"
            alt=""
          />
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6">
        <div className="-mt-10 mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-black mb-3 bg-zinc-800">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>

          <h1 className="text-lg font-semibold tracking-tight">
            {user.username || user.name}
          </h1>

          <p className="text-sm text-zinc-500 mt-1">
            {user.bio || "no bio yet"}
          </p>

          <p className="text-xs text-zinc-600 mt-1">
            {user.gigs.length} gigs • {user.rooms.length} rooms
          </p>
        </div>

        <div className="flex gap-6 text-sm mb-6 border-b border-zinc-900">
          {(["recent", "gigs", "rooms"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-2 capitalize ${
                tab === t ? "text-white" : "text-zinc-500"
              }`}
            >
              {t}
              {tab === t && (
                <motion.div
                  layoutId="underline"
                  className="absolute left-0 right-0 -bottom-[1px] h-[1.5px] bg-white"
                />
              )}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="pb-20"
        >
          {tab === "recent" && (
            <div className="space-y-4">
              {[...user.gigs]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((gig) => (
                  <div key={gig.id} className="space-y-1">
                    <p className="text-xs text-zinc-600">
                      posted a gig • {formatDate(gig.createdAt)}
                    </p>
                    <p className="text-sm text-white">{gig.title}</p>
                    {gig.reward && (
                      <p className="text-xs text-green-400">{gig.reward}</p>
                    )}
                  </div>
                ))}
              {user.gigs.length === 0 && (
                <p className="text-sm text-zinc-600">No activity yet</p>
              )}
            </div>
          )}

          {tab === "gigs" && (
            <div className="space-y-3">
              {user.gigs.length === 0 && (
                <p className="text-sm text-zinc-600">No gigs yet</p>
              )}
              {user.gigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} onClick={() => router.push(`/explore?gig=${gig.id}`)} />
              ))}
            </div>
          )}

          {tab === "rooms" && (
            <div className="space-y-4">
              {user.rooms.length === 0 && (
                <p className="text-sm text-zinc-600">No rooms yet</p>
              )}
              {user.rooms.map((room) => (
                <div key={room.id} onClick={() => router.push(`/network/${room.id}`)} className="flex justify-between items-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{room.name}</p>
                    {room.description && (
                      <p className="text-xs text-zinc-500 mt-1">{room.description}</p>
                    )}
                  </div>
                  {room.type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {room.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
