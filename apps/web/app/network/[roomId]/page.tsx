"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/AuthProvider"
import { socket } from "@/lib/socket"
import { fetchUserRooms, fetchRoomMessages } from "@/services/room/service"
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
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const roomIdsRef = useRef<string[]>([])
  const activeRoomRef = useRef<string>(roomId)
  const socketInitialized = useRef(false)

  // Keep activeRoomRef in sync
  useEffect(() => {
    activeRoomRef.current = roomId
  }, [roomId])

  // Load user rooms for sidebar
  useEffect(() => {
    if (!user) return
    fetchUserRooms()
      .then((data) => {
        setRooms(data)
        roomIdsRef.current = data.map((r) => r.id)
      })
      .catch(() => {})
  }, [user])

  // Socket connection — join ALL rooms
  useEffect(() => {
    if (!user || !roomId) return
    // Wait until rooms are loaded
    if (roomIdsRef.current.length === 0) return

    // Don't re-init if already running
    if (socketInitialized.current && socket.connected) return

    socket.auth = { userId: user.id }
    socket.connect()
    socketInitialized.current = true

    const joinAllRooms = () => {
      roomIdsRef.current.forEach((rid) => {
        socket.emit("join_room", rid)
      })
    }

    socket.on("connect", () => {
      setConnected(true)
      joinAllRooms()
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
      setConnected(false)
    })

    // Only set messages for the ACTIVE room
    socket.on("room_messages", ({ roomId: rid, messages: msgs }) => {
      if (rid === activeRoomRef.current) {
        setMessages(msgs)
        setHasMore(msgs.length >= 50)
        socket.emit("mark_seen", { roomId: rid })
      }
    })

    socket.on("receive_message", (msg: Message) => {
      if (msg.roomId === activeRoomRef.current) {
        // Active room — add to chat
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        socket.emit("mark_seen", { roomId: msg.roomId })
      } else {
        // Other room — update sidebar unread + last message
        setRooms((prev) =>
          prev.map((room) => {
            if (room.id !== msg.roomId) return room
            return {
              ...room,
              lastMessage: msg,
              unreadCount: (room.unreadCount || 0) + (msg.senderId !== user!.id ? 1 : 0),
            }
          })
        )
      }
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

    // If already connected
    if (socket.connected) {
      setConnected(true)
      joinAllRooms()
    }

    return () => {
      roomIdsRef.current.forEach((rid) => {
        socket.emit("leave_room", rid)
      })
      socket.off("connect")
      socket.off("connect_error")
      socket.off("room_messages")
      socket.off("receive_message")
      socket.off("disconnect")
      socket.disconnect()
      socketInitialized.current = false
    }
  }, [user, roomId, rooms.length])

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !roomId) return
      socket.emit("send_message", { roomId, content })
    },
    [roomId]
  )

  // Load older messages (scroll up pagination)
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || !roomId) return
    setLoadingOlder(true)
    try {
      const olderMsgs = await fetchRoomMessages(roomId, messages.length, 50)
      if (olderMsgs.length < 50) setHasMore(false)
      if (olderMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newMsgs = olderMsgs.filter((m) => !existingIds.has(m.id))
          return [...newMsgs, ...prev]
        })
      }
    } catch {}
    setLoadingOlder(false)
  }, [loadingOlder, hasMore, roomId, messages.length])

  const handleRoomSelect = useCallback(
    (id: string) => {
      if (id === roomId) return
      setMessages([])
      setHasMore(true)
      setSidebarOpen(false)
      // Clear unread for the room we're opening
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, unreadCount: 0 } : r))
      )
      router.push(`/network/${id}`)
    },
    [roomId, router]
  )

  const currentRoom = rooms.find((r) => r.id === roomId)

  if (!user) return null

  return (
    <div className="flex h-screen bg-black text-white md:ml-[70px]">
      <RoomSidebar
        rooms={rooms}
        activeRoomId={roomId}
        onRoomSelect={handleRoomSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatArea
        room={currentRoom || null}
        messages={messages}
        userId={user.id}
        connected={connected}
        onSendMessage={sendMessage}
        onOpenSidebar={() => setSidebarOpen(true)}
        onLoadOlder={loadOlderMessages}
        loadingOlder={loadingOlder}
        hasMore={hasMore}
      />
    </div>
  )
}
