"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAtom } from "jotai"
import { useAuth } from "@/app/AuthProvider"
import { socket } from "@/lib/socket"
import { fetchUserRooms } from "@/services/room/service"
import { roomsAtom, roomsLoadedAtom } from "@/lib/atom"
import { Message } from "@/types/room"
import { MessageCircle } from "lucide-react"
import RoomList from "./components/RoomList"

export default function NetworkPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useAtom(roomsAtom)
  const [roomsLoaded, setRoomsLoaded] = useAtom(roomsLoadedAtom)
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({})
  const roomIdsRef = useRef<string[]>([])

  useEffect(() => {
    if (!user || roomsLoaded) return
    fetchUserRooms()
      .then((data) => {
        setRooms(data)
        roomIdsRef.current = data.map((r) => r.id)
        setRoomsLoaded(true)
      })
      .catch(() => {})
  }, [user, roomsLoaded, setRooms, setRoomsLoaded])

  useEffect(() => {
    roomIdsRef.current = rooms.map((r) => r.id)
  }, [rooms])

  useEffect(() => {
    if (!user || rooms.length === 0) return

    const joinAll = () => {
      roomIdsRef.current.forEach((rid) => socket.emit("join_room", rid))
    }

    const handleMessage = (msg: Message) => {
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
    }

    const handleTyping = ({ roomId, username }: { roomId: string; username: string | null }) => {
      const name = username || "User"
      setTypingMap((prev) => {
        const current = prev[roomId] || []
        if (current.includes(name)) return prev
        return { ...prev, [roomId]: [...current, name] }
      })
      // Auto-clear after 3s
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

    const handleStopTyping = ({ roomId, userId: uid }: { roomId: string; userId: string }) => {
      setTypingMap((prev) => {
        const current = prev[roomId]
        if (!current || current.length === 0) return prev
        // Remove one entry
        const updated = current.slice(1)
        if (updated.length === 0) {
          const { [roomId]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [roomId]: updated }
      })
    }

    socket.on("receive_message", handleMessage)
    socket.on("user_typing", handleTyping)
    socket.on("user_stop_typing", handleStopTyping)

    if (socket.connected) joinAll()
    socket.on("connect", joinAll)

    return () => {
      roomIdsRef.current.forEach((rid) => socket.emit("leave_room", rid))
      socket.off("connect", joinAll)
      socket.off("receive_message", handleMessage)
      socket.off("user_typing", handleTyping)
      socket.off("user_stop_typing", handleStopTyping)
    }
  }, [user, rooms.length, setRooms])

  if (!user) return null

  const loading = !roomsLoaded

  return (
    <div className="h-screen bg-black text-white lg:ml-[70px] flex">
      <div className="w-full lg:w-[400px] lg:border-r lg:border-zinc-800 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-800/60">
          <h2 className="text-lg font-bold text-white">Messages</h2>
        </div>

        {loading ? (
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                <div className="w-13 h-13 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-zinc-800 rounded-md w-2/5" />
                  <div className="h-3 bg-zinc-800/60 rounded-md w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 px-8 text-center">
            <MessageCircle size={40} strokeWidth={1} className="text-zinc-700" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-zinc-600">Join rooms from the map to start chatting</p>
          </div>
        ) : (
          <RoomList
            rooms={rooms}
            typingMap={typingMap}
            onRoomSelect={(id) => router.push(`/network/${id}`)}
          />
        )}
      </div>

      {/* Desktop: empty state */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="text-center text-zinc-600">
          <MessageCircle size={48} strokeWidth={1} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">Select a conversation</p>
        </div>
      </div>
    </div>
  )
}
