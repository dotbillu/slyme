"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Room, Message } from "@/types/room"
import { Send, ArrowLeft, Users, Loader2 } from "lucide-react"

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isInitialLoad = useRef(true)
  const prevScrollHeight = useRef(0)

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

  const handleSend = () => {
    if (!input.trim()) return
    onSendMessage(input.trim())
    setInput("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-black">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
        {/* Back button — mobile only */}
        <button
          onClick={() => router.push("/network")}
          className="md:hidden p-2 -ml-1 hover:bg-zinc-800 rounded-full transition"
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
                {room.members?.length || 0} members
                {connected && (
                  <span className="ml-1.5 flex items-center gap-1 text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    active
                  </span>
                )}
              </p>
            </div>
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
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/60 rounded-full px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
          />
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-1.5 rounded-full transition-all ${
              input.trim()
                ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                : "text-zinc-700"
            }`}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
