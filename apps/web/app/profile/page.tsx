"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../AuthProvider";

type Tab = "recent" | "gigs" | "rooms";

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("recent");

  if (!user) return null;

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
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          <h1 className="text-lg font-semibold tracking-tight">
            {user.username || user.name || "user"}
          </h1>

          <p className="text-sm text-zinc-500 mt-1">
            {user.bio || "no bio yet"}
          </p>

          <p className="text-xs text-zinc-600 mt-1">
            joined {new Date(user.createdAt).getFullYear()}
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
            [...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-zinc-600">posted a gig • 2d ago</p>
                <p className="text-sm text-white">
                  Need frontend dev for landing page
                </p>
              </div>
            ))}

          {tab === "gigs" &&
            [...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Build landing page</h3>
                  <span className="text-sm text-white/80">₹2,500</span>
                </div>
                <p className="text-xs text-zinc-500">
                  clean responsive UI, fast turnaround
                </p>
                <p className="text-xs text-zinc-600">Delhi • 2 days left</p>
              </div>
            ))}

          {tab === "rooms" &&
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Late Night Builders</p>
                  <p className="text-xs text-zinc-500">12 members</p>
                </div>
                <span className="text-xs text-zinc-600">active</span>
              </div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
