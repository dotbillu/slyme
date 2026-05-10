"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Room, Message } from "@/types/room"
import { SendHorizontal, Smile, ArrowLeft, Users, Loader2 } from "lucide-react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import LinkPreviewCard, { isShareLink } from "./LinkPreviewCard"
import { socket } from "@/lib/socket"

interface ChatAreaProps {
  room: Room | null
  messages: Message[]
  userId: string
  connected: boolean
  onSendMessage: (content: string) => void
  onOpenSidebar: () => void
  onLoadOlder: () => void
  loadingOlder: boolean
  hasMore: boolean
}

interface TypingUser {
  userId: string
  username: string | null
  avatarUrl: string | null
}

interface OnlineUser {
  id: string
  username: string | null
  avatarUrl: string | null
}

export default function ChatArea({
  room,
  messages,
  userId,
  connected,
  onSendMessage,
  onOpenSidebar,
  onLoadOlder,
  loadingOlder,
  hasMore,
}: ChatAreaProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isInitialLoad = useRef(true)
  const prevScrollHeight = useRef(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // Auto-scroll on initial load and new messages
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView()
      isInitialLoad.current = false
      return
    }
    const container = messagesContainerRef.current
    if (!container) return
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Scroll down when typing indicator appears
  useEffect(() => {
    if (typingUsers.length === 0) return
    const container = messagesContainerRef.current
    if (!container) return
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [typingUsers])

  // Maintain scroll position after loading older messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || loadingOlder) return
    if (prevScrollHeight.current > 0) {
      const newScrollHeight = container.scrollHeight
      container.scrollTop = newScrollHeight - prevScrollHeight.current
      prevScrollHeight.current = 0
    }
  }, [messages, loadingOlder])

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || loadingOlder || !hasMore) return
    if (container.scrollTop < 40) {
      prevScrollHeight.current = container.scrollHeight
      onLoadOlder()
    }
  }, [loadingOlder, hasMore, onLoadOlder])

  // Typing events
  useEffect(() => {
    if (!room) return

    const handleUserTyping = ({ roomId, userId: uid, username, avatarUrl }: any) => {
      if (roomId !== room.id || uid === userId) return
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === uid)) return prev
        return [...prev, { userId: uid, username, avatarUrl }]
      })
    }

    const handleUserStopTyping = ({ roomId, userId: uid }: any) => {
      if (roomId !== room.id) return
      setTypingUsers((prev) => prev.filter((u) => u.userId !== uid))
    }

    socket.on("user_typing", handleUserTyping)
    socket.on("user_stop_typing", handleUserStopTyping)

    return () => {
      socket.off("user_typing", handleUserTyping)
      socket.off("user_stop_typing", handleUserStopTyping)
      setTypingUsers([])
    }
  }, [room, userId])

  // Online users
  useEffect(() => {
    if (!room || !connected) return

    const handleRoomOnline = ({ roomId, users }: { roomId: string; users: OnlineUser[] }) => {
      if (roomId !== room.id) return
      setOnlineUsers(users.filter((u) => u.id !== userId))
    }

    socket.on("room_online", handleRoomOnline)

    // Request online users
    socket.emit("get_room_online", { roomId: room.id })

    // Poll every 15 seconds
    const interval = setInterval(() => {
      socket.emit("get_room_online", { roomId: room.id })
    }, 15000)

    return () => {
      socket.off("room_online", handleRoomOnline)
      clearInterval(interval)
      setOnlineUsers([])
    }
  }, [room, connected, userId])

  // Emit typing/stop_typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)

    if (!room) return

    if (!isTypingRef.current && e.target.value.trim()) {
      isTypingRef.current = true
      socket.emit("typing", { roomId: room.id })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        socket.emit("stop_typing", { roomId: room.id })
      }
    }, 2000)
  }

  const handleSend = () => {
    if (!input.trim()) return
    onSendMessage(input.trim())
    setInput("")
    setShowEmojiPicker(false)
    // Stop typing
    if (isTypingRef.current && room) {
      isTypingRef.current = false
      socket.emit("stop_typing", { roomId: room.id })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-black">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
        {/* Back button — mobile only */}
        <button
          onClick={() => router.push("/network")}
          className="lg:hidden p-2 -ml-1 hover:bg-zinc-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>

        {room ? (
          <>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-zinc-800">
              {room.imageUrl ? (
                <img src={room.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-zinc-300">
                  {room.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">{room.name}</p>
              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Users size={10} />
                {room.members?.length || 0}
              </p>
            </div>
            {/* Online users avatars — stacked on the right, only if others are online */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center -space-x-2 flex-shrink-0">
                {onlineUsers.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    className="relative w-7 h-7 rounded-full bg-zinc-700 ring-2 ring-black overflow-visible flex items-center justify-center"
                    title={u.username || "user"}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-[9px] font-medium text-zinc-300">
                            {u.username?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-black" />
                  </div>
                ))}
                {onlineUsers.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 ring-2 ring-black flex items-center justify-center">
                    <span className="text-[9px] font-bold text-zinc-400">+{onlineUsers.length - 4}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1">
            <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
      >
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <Loader2 size={16} className="animate-spin text-zinc-600" />
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="flex justify-center py-3 pb-4">
            <span className="text-[11px] text-zinc-700 bg-zinc-900 px-3 py-1 rounded-full">
              Start of conversation
            </span>
          </div>
        )}

        {messages.length === 0 && !loadingOlder ? (
          !connected ? (
            // Skeleton loader while waiting for socket to connect and deliver messages
            <div className="space-y-3 animate-pulse pt-4">
              {/* Left-aligned skeletons */}
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-zinc-800 rounded-full w-20" />
                  <div className="h-8 bg-zinc-800 rounded-2xl rounded-bl-md w-44" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="w-7 flex-shrink-0" />
                <div className="h-8 bg-zinc-800/70 rounded-2xl rounded-bl-md w-32" />
              </div>
              {/* Right-aligned skeletons */}
              <div className="flex items-end gap-2 flex-row-reverse">
                <div className="w-7 flex-shrink-0" />
                <div className="h-8 bg-zinc-800/50 rounded-2xl rounded-br-md w-36" />
              </div>
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="h-8 bg-zinc-800 rounded-2xl rounded-bl-md w-52" />
              </div>
              <div className="flex items-end gap-2 flex-row-reverse">
                <div className="w-7 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-8 bg-zinc-800/50 rounded-2xl rounded-br-md w-40" />
                  <div className="h-8 bg-zinc-800/40 rounded-2xl rounded-br-md w-28" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="w-7 flex-shrink-0" />
                <div className="h-8 bg-zinc-800/60 rounded-2xl rounded-bl-md w-48" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-1">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs text-zinc-700">Say something to get started</p>
            </div>
          )
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === userId
            const prevMsg = messages[idx - 1]
            const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId
            const showGap = !prevMsg || prevMsg.senderId !== msg.senderId

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""} ${showGap ? "pt-2" : ""}`}
              >
                {/* Avatar spacer */}
                <div className="w-7 flex-shrink-0">
                  {!isOwn && showAvatar && (
                    <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                      {msg.sender?.avatarUrl ? (
                        <img src={msg.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-400">
                          {msg.sender?.username?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && showAvatar && (
                    <p className="text-[10px] text-zinc-600 mb-0.5 ml-1 font-medium">
                      {msg.sender?.username || "user"}
                    </p>
                  )}
                  {isShareLink(msg.content) ? (
                    <LinkPreviewCard content={msg.content} />
                  ) : (
                    <div
                      className={`
                        px-3.5 py-2 text-[13px] leading-relaxed
                        ${isOwn
                          ? "bg-green-600 text-white rounded-2xl rounded-br-md"
                          : "bg-zinc-800/80 text-zinc-100 rounded-2xl rounded-bl-md"
                        }
                      `}
                    >
                      <p className="break-words">{msg.content}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
        {/* Typing indicator — inside scroll, at the bottom */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 pt-2 pb-1"
            >
              <div className="flex -space-x-1.5">
                {typingUsers.slice(0, 3).map((u) => (
                  <div
                    key={u.userId}
                    className="w-5 h-5 rounded-full bg-zinc-800 ring-1 ring-black overflow-hidden flex items-center justify-center"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-zinc-400">
                        {u.username?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-zinc-500">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username || "Someone"} is typing`
                  : `${typingUsers.length} people typing`}
              </span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-black px-4">
        <div className="py-3 relative">
          {showEmojiPicker && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowEmojiPicker(false)} 
              />
              <div className="absolute bottom-[60px] left-0 z-50 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData) => setInput((prev) => prev + emojiData.emoji)} 
                  lazyLoadEmojis={true}
                />
              </div>
            </>
          )}
          <motion.div
            layout
            className="flex items-center gap-2 bg-zinc-950 border border-zinc-800/50 rounded-full px-4 py-2.5 relative z-50"
          >
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-zinc-600 hover:text-zinc-400 transition flex-shrink-0"
            >
              <Smile size={18} />
            </motion.button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Message..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600 min-w-0"
            />
            <motion.button
              whileTap={{ scale: 0.75, rotate: -15 }}
              animate={input.trim() ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-1.5 rounded-full flex-shrink-0 ${
                input.trim()
                  ? "text-green-400"
                  : "text-zinc-800"
              }`}
            >
              <SendHorizontal size={18} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
