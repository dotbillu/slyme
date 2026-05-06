"use client"

import { useState, useRef, useEffect } from "react"
import { Room, Message } from "@/types/room"
import { Send, Menu, Users, Info, User } from "lucide-react"

interface ChatAreaProps {
  room: Room | null
  messages: Message[]
  userId: string
  connected: boolean
  onSendMessage: (content: string) => void
  onOpenSidebar: () => void
}

export default function ChatArea({
  room,
  messages,
  userId,
  connected,
  onSendMessage,
  onOpenSidebar,
}: ChatAreaProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSendMessage(input.trim())
    setInput("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 hover:bg-zinc-800 rounded-full"
        >
          <Menu size={20} />
        </button>

        {room ? (
          <>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {room.imageUrl ? (
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {room.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{room.name}</p>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Users size={11} />
                {room.members?.length || 0} members
                {connected && (
                  <span className="ml-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    connected
                  </span>
                )}
              </p>
            </div>
            <button className="p-2 hover:bg-zinc-800 rounded-full">
              <Info size={20} className="text-zinc-400" />
            </button>
          </>
        ) : (
          <div className="flex-1">
            <p className="text-zinc-400 text-sm">Loading room...</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === userId
            const showAvatar =
              idx === 0 || messages[idx - 1]?.senderId !== msg.senderId

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className="w-7 flex-shrink-0">
                  {!isOwn && showAvatar ? (
                    <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden">
                    <User/>
                    </div>
                  ) : null}
                </div>

                {/* Message bubble */}
                <div
                  className={`
                    max-w-[70%] px-3 py-2 rounded-2xl text-sm
                    ${isOwn
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-zinc-800 text-white rounded-bl-md"
                    }
                  `}
                >
                  {!isOwn && showAvatar && (
                    <p className="text-[10px] text-zinc-400 mb-0.5 font-medium">
                        <User/>
                    </p>
                  )}
                  <p className="break-words">{msg.content}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-1.5 rounded-full transition-colors ${
              input.trim()
                ? "text-blue-500 hover:text-blue-400"
                : "text-zinc-600"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
