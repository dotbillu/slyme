"use client"

import { useState, useEffect } from "react"
import { ExternalLink, MapPin, Users } from "lucide-react"
import { Gig } from "@/types/gig"
import { Room } from "@/types/room"
import { fetchGigById } from "@/services/gig/service"
import { fetchRoomById } from "@/services/room/service"

const SHARE_PATTERN = /(?:https?:\/\/)?(?:[\w.-]*\/)?explore\?(?:gig|room)=[a-f0-9-]+/i

interface ParsedLink {
  type: "gig" | "room"
  id: string
  url: string
}

function parseShareLink(text: string): ParsedLink | null {
  const match = text.match(SHARE_PATTERN)
  if (!match) return null

  const url = match[0]
  try {
    // Build a full URL for parsing
    const fullUrl = url.startsWith("http") ? url : `https://${url}`
    const parsed = new URL(fullUrl)
    const gigId = parsed.searchParams.get("gig")
    const roomId = parsed.searchParams.get("room")

    if (gigId) return { type: "gig", id: gigId, url: fullUrl }
    if (roomId) return { type: "room", id: roomId, url: fullUrl }
  } catch {}

  return null
}

export function isShareLink(content: string): boolean {
  return SHARE_PATTERN.test(content)
}

export default function LinkPreviewCard({ content }: { content: string }) {
  const [link] = useState(() => parseShareLink(content))
  const [gig, setGig] = useState<Gig | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!link) return

    const load = async () => {
      try {
        if (link.type === "gig") {
          const data = await fetchGigById(link.id)
          setGig(data)
        } else {
          const data = await fetchRoomById(link.id)
          setRoom(data)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [link])

  if (!link) return <p className="break-words">{content}</p>

  const handleClick = () => {
    window.open(link.url, "_blank", "noopener")
  }

  if (loading) {
    return (
      <div className="w-56 animate-pulse">
        <div className="h-28 bg-zinc-700/50 rounded-lg mb-2" />
        <div className="h-3 bg-zinc-700/50 rounded w-3/4 mb-1.5" />
        <div className="h-2.5 bg-zinc-700/30 rounded w-1/2" />
      </div>
    )
  }

  if (error) {
    return <p className="break-words">{content}</p>
  }

  // ─── Gig card ───
  if (link.type === "gig" && gig) {
    const image = gig.imageUrls?.[0]
    return (
      <button
        onClick={handleClick}
        className="block w-56 text-left rounded-xl overflow-hidden bg-zinc-800/60 border border-zinc-700/40 hover:border-zinc-600/60 transition group cursor-pointer"
      >
        {/* Image */}
        {image ? (
          <div className="w-full h-28 overflow-hidden">
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-28 bg-gradient-to-br from-green-600/30 to-emerald-500/20 flex items-center justify-center">
            <MapPin size={28} className="text-green-400/60" />
          </div>
        )}

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="text-[13px] font-semibold text-white truncate group-hover:text-green-400 transition">
            {gig.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {gig.type && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                {gig.type}
              </span>
            )}
            <span className="text-[10px] text-zinc-500 flex items-center gap-0.5 ml-auto">
              <ExternalLink size={9} /> Open
            </span>
          </div>
        </div>
      </button>
    )
  }

  // ─── Room card ───
  if (link.type === "room" && room) {
    const memberCount = room._count?.members || room.members?.length || 0
    return (
      <button
        onClick={handleClick}
        className="block w-56 text-left rounded-xl overflow-hidden bg-zinc-800/60 border border-zinc-700/40 hover:border-zinc-600/60 transition group cursor-pointer"
      >
        {/* Image */}
        {room.imageUrl ? (
          <div className="w-full h-28 overflow-hidden">
            <img
              src={room.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-28 bg-gradient-to-br from-purple-600/30 to-pink-500/20 flex items-center justify-center">
            <Users size={28} className="text-purple-400/60" />
          </div>
        )}

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="text-[13px] font-semibold text-white truncate group-hover:text-purple-400 transition">
            {room.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Users size={10} /> {memberCount} members
            </span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-0.5 ml-auto">
              <ExternalLink size={9} /> Open
            </span>
          </div>
        </div>
      </button>
    )
  }

  return <p className="break-words">{content}</p>
}
