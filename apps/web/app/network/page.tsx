"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/AuthProvider"
import { fetchUserRooms } from "@/services/room/service"
import { Room } from "@/types/room"
import { MessageCircle, Users } from "lucide-react"

export default function NetworkPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchUserRooms()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  return (
    <div className="flex h-screen bg-black text-white md:ml-[70px]">
      {/* Room list - full width on this page since no room is selected */}
      <div className="w-full max-w-2xl mx-auto flex flex-col border-x border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} />
            <h1 className="text-xl font-semibold">{user.username}</h1>
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
              <MessageCircle size={48} strokeWidth={1} />
              <p className="text-lg">No rooms yet</p>
              <p className="text-sm">Join rooms from the explore map to start chatting</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/network/${room.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors text-left"
                >
                  {/* Room avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {room.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{room.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {room.description || "No description"}
                    </p>
                  </div>

                  {/* Member count */}
                  <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Users size={14} />
                    <span>{room.members?.length || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
