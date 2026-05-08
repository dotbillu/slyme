"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/AuthProvider"
import { socket } from "@/lib/socket"
import { fetchUserRooms } from "@/services/room/service"
import { Room, Message } from "@/types/room"
import { MessageCircle, Users } from "lucide-react"

export default function NetworkPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const roomIdsRef = useRef<string[]>([])
  const socketInitialized = useRef(false)

  useEffect(() => {
    if (!user) return
    fetchUserRooms()
      .then((data) => {
        setRooms(data)
        roomIdsRef.current = data.map((r) => r.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Connect socket and join all rooms to receive real-time messages
  useEffect(() => {
    if (!user || roomIdsRef.current.length === 0 || loading) return
    if (socketInitialized.current) return

    socket.auth = { userId: user.id }
    socket.connect()
    socketInitialized.current = true

    const joinAllRooms = () => {
      roomIdsRef.current.forEach((rid) => {
        socket.emit("join_room", rid)
      })
    }

    socket.on("connect", () => {
      joinAllRooms()
    })

    // When a new message arrives for any room, update last message + unread
    socket.on("receive_message", (msg: Message) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== msg.roomId) return room
          return {
            ...room,
            lastMessage: msg,
            unreadCount: (room.unreadCount || 0) + (msg.senderId !== user.id ? 1 : 0),
          }
        })
      )
    })

    if (socket.connected) {
      joinAllRooms()
    }

    return () => {
      roomIdsRef.current.forEach((rid) => {
        socket.emit("leave_room", rid)
      })
      socket.off("connect")
      socket.off("receive_message")
      socket.disconnect()
      socketInitialized.current = false
    }
  }, [user, loading, rooms.length])

  if (!user) return null

  // Sort rooms: rooms with unread first, then by last message time
  const sortedRooms = [...rooms].sort((a, b) => {
    if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1
    if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1
    const aTime = a.lastMessage?.createdAt || a.createdAt
    const bTime = b.lastMessage?.createdAt || b.createdAt
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <div className="flex h-screen bg-black text-white md:ml-[70px]">
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
              {sortedRooms.map((room) => {
                const hasUnread = (room.unreadCount || 0) > 0

                return (
                  <button
                    key={room.id}
                    onClick={() => router.push(`/network/${room.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors text-left"
                  >
                    {/* Room avatar */}
                    <div className="relative">
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
                      {/* Unread dot */}
                      {hasUnread && (
                        <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">
                            {room.unreadCount! > 9 ? "9+" : room.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Room info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${hasUnread ? "font-bold" : "font-semibold"}`}>
                        {room.name}
                      </p>
                      <p className={`text-xs truncate ${hasUnread ? "text-white" : "text-zinc-400"}`}>
                        {room.lastMessage
                          ? `${room.lastMessage.sender?.username || "user"}: ${room.lastMessage.content}`
                          : room.description || "No messages yet"}
                      </p>
                    </div>

                    {/* Time */}
                    {room.lastMessage && (
                      <span className="text-[10px] text-zinc-500 flex-shrink-0">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
