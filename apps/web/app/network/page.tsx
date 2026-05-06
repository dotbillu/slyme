"use client"

import { useEffect, useState } from "react"
import { socket } from "@/lib/socket"

export default function Inbox() {
  const [roomId, setRoomId] = useState("room1")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    socket.connect()

    socket.emit("join_room", roomId)

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.off("receive_message")
      socket.disconnect()
    }
  }, [roomId])

  const sendMessage = () => {
    if (!message.trim()) return

    socket.emit("send_message", {
      roomId,
      content: message,
      senderId: "temp-user-id",
    })

    setMessage("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div>
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="room id"
        />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <b>{m.sender?.username ?? "user"}:</b> {m.content}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}
