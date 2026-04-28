"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { UserPublic } from "@/types/user";

type Tab = "recent" | "gigs" | "rooms";

export default function ProfileClient({ user }: { user: UserPublic }) {
  const [tab, setTab] = useState<Tab>("recent");

  return (
    <div className="w-full min-h-screen bg-black text-white">
      <div className="h-56 w-full bg-zinc-900 overflow-hidden">
        {user.coverImageUrl && (
          <img
            src={user.coverImageUrl}
            className="w-full h-full object-cover opacity-80"
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
          className="space-y-6 pb-20"
        >
          {tab === "recent" &&
            [...user.gigs]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 5)
              .map((gig) => (
                <div key={gig.id} className="space-y-1">
                  <p className="text-xs text-zinc-600">
                    posted a gig •{" "}
                    {new Date(gig.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-white">{gig.title}</p>
                </div>
              ))}

          {tab === "gigs" &&
            user.gigs.map((gig) => (
              <div key={gig.id} className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">{gig.title}</h3>
                  {gig.reward && (
                    <span className="text-sm text-white/80">{gig.reward}</span>
                  )}
                </div>

                {gig.description && (
                  <p className="text-xs text-zinc-500">{gig.description}</p>
                )}

                <p className="text-xs text-zinc-600">
                  {gig.date
                    ? new Date(gig.date).toLocaleDateString()
                    : "no date"}
                </p>
              </div>
            ))}

          {tab === "rooms" &&
            user.rooms.map((room) => (
              <div key={room.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{room.name}</p>
                  {room.description && (
                    <p className="text-xs text-zinc-500">
                      {room.description}
                    </p>
                  )}
                </div>

                {room.type && (
                  <span className="text-xs text-zinc-600">{room.type}</span>
                )}
              </div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
