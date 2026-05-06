"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/AuthProvider"
import { socket } from "@/lib/socket"
import { fetchUserRooms } from "@/services/room/service"
import { Room, Message } from "@/types/room"
import RoomSidebar from "./components/RoomSidebar"
import ChatArea from "./components/ChatArea"

export default function RoomChatPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [rooms, setRooms] = useState<Room[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const joinedRoomRef = useRef<string | null>(null)

  // Load user rooms for sidebar
  useEffect(() => {
    if (!user) return
    fetchUserRooms()
      .then(setRooms)
      .catch(() => {})
  }, [user])

  // Socket connection
  useEffect(() => {
    if (!user || !roomId) return

    // Pass userId via handshake auth
    socket.auth = { userId: user.id }
    socket.connect()

    socket.on("connect", () => {
      setConnected(true)
      socket.emit("join_room", roomId)
      joinedRoomRef.current = roomId
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
      setConnected(false)
    })

    socket.on("room_messages", ({ roomId: rid, messages: msgs }) => {
      if (rid === roomId) {
        setMessages(msgs)
      }
    })

    socket.on("receive_message", (msg: Message) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

    // If already connected, join immediately
    if (socket.connected) {
      setConnected(true)
      socket.emit("join_room", roomId)
      joinedRoomRef.current = roomId
    }

    return () => {
      if (joinedRoomRef.current) {
        socket.emit("leave_room", joinedRoomRef.current)
        joinedRoomRef.current = null
      }
      socket.off("connect")
      socket.off("connect_error")
      socket.off("room_messages")
      socket.off("receive_message")
      socket.off("disconnect")
      socket.disconnect()
    }
  }, [user, roomId])

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !roomId) return
      socket.emit("send_message", { roomId, content })
    },
    [roomId]
  )

  const handleRoomSelect = useCallback(
    (id: string) => {
      if (id === roomId) return
      // Leave current room
      if (joinedRoomRef.current) {
        socket.emit("leave_room", joinedRoomRef.current)
      }
      setMessages([])
      setSidebarOpen(false)
      router.push(`/network/${id}`)
    },
    [roomId, router]
  )

  const currentRoom = rooms.find((r) => r.id === roomId)

  if (!user) return null

  return (
    <div className="flex h-screen bg-black text-white md:ml-[70px]">
      {/* Sidebar - room list */}
      <RoomSidebar
        rooms={rooms}
        activeRoomId={roomId}
        onRoomSelect={handleRoomSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Chat area */}
      <ChatArea
        room={currentRoom || null}
        messages={messages}
        userId={user.id}
        connected={connected}
        onSendMessage={sendMessage}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  )
}
