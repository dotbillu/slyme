"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAtom } from "jotai"
import { useAuth } from "@/app/AuthProvider"
import { socket } from "@/lib/socket"
import { fetchUserRooms, fetchRoomMessages } from "@/services/room/service"
import { roomsAtom, roomsLoadedAtom } from "@/lib/atom"
import { Message } from "@/types/room"
import RoomSidebar from "./components/RoomSidebar"
import ChatArea from "./components/ChatArea"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"

export default function RoomChatPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [rooms, setRooms] = useAtom(roomsAtom)
  const [roomsLoaded, setRoomsLoaded] = useAtom(roomsLoadedAtom)

  const messages = useLiveQuery(
    () => db.messages.where("roomId").equals(roomId).sortBy("createdAt"),
    [roomId],
    []
  )
  
  const [connected, setConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const roomIdsRef = useRef<string[]>([])
  const activeRoomRef = useRef<string>(roomId)

  useEffect(() => {
    activeRoomRef.current = roomId
  }, [roomId])

  // Fetch rooms if not already loaded (e.g. direct navigation to /network/[id])
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

  // Keep ref in sync
  useEffect(() => {
    roomIdsRef.current = rooms.map((r) => r.id)
  }, [rooms])

  // Socket — join ALL rooms, handle messages (socket managed by navbar)
  useEffect(() => {
    if (!user || !roomId || rooms.length === 0) return

    const joinAllRooms = () => {
      roomIdsRef.current.forEach((rid) => socket.emit("join_room", rid))
    }

    const handleConnect = () => {
      setConnected(true)
      joinAllRooms()
      if (document.visibilityState === "visible" && document.hasFocus()) {
        socket.emit("mark_seen", { roomId })
      }
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
      )
    }

    const handleConnectError = (err: Error) => {
      console.error("Socket connection error:", err.message)
      setConnected(false)
    }

    const handleRoomMessages = async ({ roomId: rid, messages: msgs }: { roomId: string; messages: Message[] }) => {
      if (msgs.length > 0) {
        await db.messages.bulkPut(msgs)
      }
      if (rid === activeRoomRef.current) {
        setHasMore(msgs.length >= 50)
      }
    }

    const handleReceiveMessage = async (msg: Message) => {
      await db.messages.put(msg)
      if (msg.roomId === activeRoomRef.current && document.visibilityState === "visible" && document.hasFocus()) {
        socket.emit("mark_seen", { roomId: msg.roomId })
      } else {
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
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    socket.on("connect", handleConnect)
    socket.on("connect_error", handleConnectError)
    socket.on("room_messages", handleRoomMessages)
    socket.on("receive_message", handleReceiveMessage)
    socket.on("disconnect", handleDisconnect)

    // If already connected, join immediately
    if (socket.connected) {
      setConnected(true)
      joinAllRooms()
      if (document.visibilityState === "visible" && document.hasFocus()) {
        socket.emit("mark_seen", { roomId })
      }
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
      )
    }

    return () => {
      roomIdsRef.current.forEach((rid) => socket.emit("leave_room", rid))
      socket.off("connect", handleConnect)
      socket.off("connect_error", handleConnectError)
      socket.off("room_messages", handleRoomMessages)
      socket.off("receive_message", handleReceiveMessage)
      socket.off("disconnect", handleDisconnect)
    }
  }, [user, roomId, rooms.length, setRooms])

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !roomId) return
      socket.emit("send_message", { roomId, content })
    },
    [roomId]
  )

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || !roomId) return
    setLoadingOlder(true)
    try {
      const olderMsgs = await fetchRoomMessages(roomId, messages.length, 50)
      if (olderMsgs.length < 50) setHasMore(false)
      if (olderMsgs.length > 0) {
        await db.messages.bulkPut(olderMsgs)
      }
    } catch {}
    setLoadingOlder(false)
  }, [loadingOlder, hasMore, roomId, messages.length])

  const handleRoomSelect = useCallback(
    (id: string) => {
      if (id === roomId) return
      setHasMore(true)
      setSidebarOpen(false)
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, unreadCount: 0 } : r))
      )
      router.push(`/network/${id}`)
    },
    [roomId, router, setRooms]
  )

  const currentRoom = rooms.find((r) => r.id === roomId)

  if (!user) return null

  return (
    <div className="flex h-[calc(100dvh-4rem)] lg:h-screen bg-black text-white lg:ml-[70px]">
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
