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
      // Don't mark_seen here — wait until messages are actually loaded and visible
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
      // Don't mark_seen here — loading messages != seeing them.
      // Seen is handled by the markSeenIfVisible effect below.
    }

    const handleReceiveMessage = async (msg: Message) => {
      await db.messages.put(msg)
      const isOnRoom = window.location.pathname === `/network/${msg.roomId}`
      if (isOnRoom && msg.roomId === activeRoomRef.current && document.visibilityState === "visible" && document.hasFocus()) {
        // Only mark seen if user is scrolled near the bottom (can actually see new messages)
        const container = document.querySelector("[data-chat-container]")
        const isNearBottom = container
          ? container.scrollHeight - container.scrollTop - container.clientHeight < 150
          : false
        if (isNearBottom) {
          socket.emit("mark_seen", { roomId: msg.roomId })
        } else {
          // User is scrolled up, treat as unread
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
      // Don't mark_seen here — will be handled by room_messages callback
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

  // Mark messages as seen when user is actively viewing the room
  // Uses a delay to avoid marking seen on quick room switches
  useEffect(() => {
    if (!user || !roomId) return

    let seenTimeout: NodeJS.Timeout | null = null

    const isOnThisRoom = () => {
      return window.location.pathname === `/network/${roomId}`
    }

    const markSeenIfVisible = () => {
      if (!isOnThisRoom()) return
      if (document.visibilityState !== "visible" || !document.hasFocus()) return
      const container = document.querySelector("[data-chat-container]")
      const isNearBottom = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 150
        : true // if container not mounted yet, assume bottom (initial load)
      if (isNearBottom) {
        socket.emit("mark_seen", { roomId })
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
        )
      }
    }

    // Delay marking seen by 1.5s after entering a room — if user leaves quickly, it won't fire
    seenTimeout = setTimeout(markSeenIfVisible, 1500)

    const handleVisibilityChange = () => {
      markSeenIfVisible()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleVisibilityChange)

    return () => {
      if (seenTimeout) clearTimeout(seenTimeout)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleVisibilityChange)
    }
  }, [user, roomId, setRooms])

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
      // Don't clear unreadCount here — let the mark_seen delay handle it
      router.push(`/network/${id}`)
    },
    [roomId, router]
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
