"use client"

import { useEffect, useState } from "react"
import { Room } from "@/types/room"
import { socket } from "@/lib/socket"
import RoomList from "../../components/RoomList"

interface RoomSidebarProps {
  rooms: Room[]
  activeRoomId: string
  onRoomSelect: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function RoomSidebar({
  rooms,
  activeRoomId,
  onRoomSelect,
}: RoomSidebarProps) {
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const handleTyping = ({ roomId, username }: { roomId: string; username: string | null }) => {
      if (roomId === activeRoomId) return // active room shows its own typing indicator
      const name = username || "User"
      setTypingMap((prev) => {
        const current = prev[roomId] || []
        if (current.includes(name)) return prev
        return { ...prev, [roomId]: [...current, name] }
      })
      setTimeout(() => {
        setTypingMap((prev) => {
          const current = prev[roomId]
          if (!current) return prev
          const updated = current.filter((n) => n !== name)
          if (updated.length === 0) {
            const { [roomId]: _, ...rest } = prev
            return rest
          }
          return { ...prev, [roomId]: updated }
        })
      }, 3000)
    }

    const handleStopTyping = ({ roomId }: { roomId: string }) => {
      setTypingMap((prev) => {
        const current = prev[roomId]
        if (!current || current.length === 0) return prev
        const updated = current.slice(1)
        if (updated.length === 0) {
          const { [roomId]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [roomId]: updated }
      })
    }

    socket.on("user_typing", handleTyping)
    socket.on("user_stop_typing", handleStopTyping)

    return () => {
      socket.off("user_typing", handleTyping)
      socket.off("user_stop_typing", handleStopTyping)
    }
  }, [activeRoomId])

  return (
    <aside className="hidden lg:flex w-[380px] flex-col border-r border-zinc-800/60 bg-black">
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <h2 className="text-lg font-bold text-white">Messages</h2>
      </div>

      {rooms.length === 0 ? (
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
              <div className="w-13 h-13 rounded-full bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-zinc-800 rounded-md w-2/5" />
                <div className="h-3 bg-zinc-800/60 rounded-md w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <RoomList
          rooms={rooms}
          activeRoomId={activeRoomId}
          typingMap={typingMap}
          onRoomSelect={onRoomSelect}
        />
      )}
    </aside>
  )
}
