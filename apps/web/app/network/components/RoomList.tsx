"use client"

import { Room } from "@/types/room"
import { motion } from "framer-motion"

interface RoomListProps {
  rooms: Room[]
  activeRoomId?: string
  typingMap: Record<string, string[]>
  onRoomSelect: (id: string) => void
}

export default function RoomList({
  rooms,
  activeRoomId,
  typingMap,
  onRoomSelect,
}: RoomListProps) {
  // Sort: unread first, then by latest message
  const sortedRooms = [...rooms].sort((a, b) => {
    if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1
    if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1
    const aTime = a.lastMessage?.createdAt || a.createdAt
    const bTime = b.lastMessage?.createdAt || b.createdAt
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedRooms.map((room, idx) => {
        const isActive = room.id === activeRoomId
        const hasUnread = (room.unreadCount || 0) > 0 && !isActive
        const typing = typingMap[room.id]

        return (
          <motion.button
            key={room.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRoomSelect(room.id)}
            className={`
              w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left
              ${isActive ? "bg-zinc-800/50" : "hover:bg-zinc-900/60"}
            `}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-13 h-13 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-800 ${
                isActive ? "ring-2 ring-green-500/40" : "ring-2 ring-zinc-800"
              }`}>
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-semibold text-zinc-300">
                    {room.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {hasUnread && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${
                  hasUnread ? "font-bold text-white" : isActive ? "font-semibold text-white" : "font-medium text-zinc-300"
                }`}>
                  {room.name}
                </p>
                {room.lastMessage && (
                  <span className={`text-[10px] flex-shrink-0 ml-2 ${hasUnread ? "text-green-400" : "text-zinc-600"}`}>
                    {formatTime(room.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-zinc-200" : "text-zinc-500"}`}>
                {typing && typing.length > 0 ? (
                  <span className="text-zinc-400 italic">
                    {typing[0]} is typing...
                  </span>
                ) : room.lastMessage
                  ? `${room.lastMessage.sender?.username || room.lastMessage.sender?.id?.slice(0, 6) || "user"}: ${room.lastMessage.content}`
                  : `${room.members?.length || 0} members`}
              </p>
            </div>

            {/* Unread badge */}
            {hasUnread && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-black">
                  {room.unreadCount! > 9 ? "9+" : room.unreadCount}
                </span>
              </div>
            )}
          </motion.button>
        )
      })}
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
