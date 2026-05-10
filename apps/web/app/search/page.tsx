"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search as SearchIcon, X, Users, MapPin, User as UserIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/app/AuthProvider"
import { socket } from "@/lib/socket"
import { joinRoom } from "@/services/room/service"
import { useSetAtom } from "jotai"
import { roomsLoadedAtom } from "@/lib/atom"

interface SearchUser {
  id: string
  username: string | null
  name: string | null
  avatarUrl: string | null
  bio: string | null
}

interface SearchRoom {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  type: string | null
  createdBy: { id: string; username: string | null; name: string | null; avatarUrl: string | null }
  _count: { members: number }
}

interface SearchGig {
  id: string
  title: string
  description: string | null
  type: string | null
  reward: string | null
  imageUrls: string[]
  latitude: number
  longitude: number
  createdBy: { id: string; username: string | null; name: string | null; avatarUrl: string | null }
}

interface SearchResults {
  query: string
  users: SearchUser[]
  rooms: SearchRoom[]
  gigs: SearchGig[]
}

type Tab = "all" | "users" | "rooms" | "gigs"

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const setRoomsLoaded = useSetAtom(roomsLoadedAtom)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>("all")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Socket search listener
  useEffect(() => {
    const handleResults = (data: SearchResults) => {
      setResults(data)
      setLoading(false)
    }
    socket.on("search_results", handleResults)
    return () => {
      socket.off("search_results", handleResults)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(() => {
      socket.emit("search", { query: query.trim() })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleUserClick = useCallback((u: SearchUser) => {
    if (u.username) router.push(`/${u.username}`)
  }, [router])

  const handleRoomClick = useCallback(async (room: SearchRoom) => {
    try {
      if (user) await joinRoom(room.id)
    } catch {}
    setRoomsLoaded(false)
    router.push(`/network/${room.id}`)
  }, [user, router, setRoomsLoaded])

  const handleGigClick = useCallback((gig: SearchGig) => {
    router.push(`/explore?gig=${gig.id}`)
  }, [router])

  const userCount = results?.users.length || 0
  const roomCount = results?.rooms.length || 0
  const gigCount = results?.gigs.length || 0
  const totalCount = userCount + roomCount + gigCount

  const showUsers = (tab === "all" || tab === "users") && userCount > 0
  const showRooms = (tab === "all" || tab === "rooms") && roomCount > 0
  const showGigs = (tab === "all" || tab === "gigs") && gigCount > 0

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white lg:ml-[70px] pb-20 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Search input */}
        <div className="sticky top-0 bg-black pb-4 pt-2 z-10">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5">
            <SearchIcon size={18} className="text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, rooms, gigs..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
            />
            {loading ? (
              <Loader2 size={16} className="text-zinc-500 animate-spin flex-shrink-0" />
            ) : query ? (
              <button
                onClick={() => setQuery("")}
                className="text-zinc-500 hover:text-white transition flex-shrink-0"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {/* Tabs */}
          {results && totalCount > 0 && (
            <div className="flex gap-1 mt-3 overflow-x-auto">
              <TabButton active={tab === "all"} onClick={() => setTab("all")} label={`All ${totalCount}`} />
              {userCount > 0 && <TabButton active={tab === "users"} onClick={() => setTab("users")} label={`Users ${userCount}`} />}
              {roomCount > 0 && <TabButton active={tab === "rooms"} onClick={() => setTab("rooms")} label={`Rooms ${roomCount}`} />}
              {gigCount > 0 && <TabButton active={tab === "gigs"} onClick={() => setTab("gigs")} label={`Gigs ${gigCount}`} />}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!query ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-600 gap-2">
              <SearchIcon size={40} strokeWidth={1} className="text-zinc-700" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs text-zinc-700">Find users, rooms, and gigs</p>
            </div>
          ) : loading && !results ? (
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-zinc-800 rounded-md w-1/3" />
                    <div className="h-3 bg-zinc-800/60 rounded-md w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results && totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-600 gap-2">
              <p className="text-sm">No results for &quot;{query}&quot;</p>
              <p className="text-xs text-zinc-700">Try a different search</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {showUsers && (
                  <Section title="Users" icon={<UserIcon size={14} />}>
                    {results!.users.map((u) => (
                      <ResultItem
                        key={`user-${u.id}`}
                        onClick={() => handleUserClick(u)}
                        avatar={u.avatarUrl}
                        fallback={u.username?.charAt(0) || u.name?.charAt(0) || "?"}
                        title={u.username || u.name || "user"}
                        subtitle={u.bio || u.name || ""}
                      />
                    ))}
                  </Section>
                )}

                {showRooms && (
                  <Section title="Rooms" icon={<Users size={14} />}>
                    {results!.rooms.map((r) => (
                      <ResultItem
                        key={`room-${r.id}`}
                        onClick={() => handleRoomClick(r)}
                        avatar={r.imageUrl}
                        fallback={r.name.charAt(0)}
                        title={r.name}
                        subtitle={r.description || `${r._count.members} members`}
                        badge={r.type}
                        accent="purple"
                      />
                    ))}
                  </Section>
                )}

                {showGigs && (
                  <Section title="Gigs" icon={<MapPin size={14} />}>
                    {results!.gigs.map((g) => (
                      <ResultItem
                        key={`gig-${g.id}`}
                        onClick={() => handleGigClick(g)}
                        avatar={g.imageUrls[0] || g.createdBy.avatarUrl}
                        fallback={g.title.charAt(0)}
                        title={g.title}
                        subtitle={g.description || `by ${g.createdBy.username || g.createdBy.name}`}
                        badge={g.reward || g.type}
                        accent="green"
                      />
                    ))}
                  </Section>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
        active
          ? "bg-white text-black"
          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {label}
    </button>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2 px-1">
        {icon}
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ResultItem({
  onClick,
  avatar,
  fallback,
  title,
  subtitle,
  badge,
  accent,
}: {
  onClick: () => void
  avatar: string | null
  fallback: string
  title: string
  subtitle: string
  badge?: string | null
  accent?: "green" | "purple" | "default"
}) {
  const accentColor =
    accent === "green"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : accent === "purple"
      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
      : "bg-zinc-800 text-zinc-400"

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition text-left"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-zinc-800">
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-base font-semibold text-zinc-300">
            {fallback.toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        {subtitle && <p className="text-xs text-zinc-500 truncate mt-0.5">{subtitle}</p>}
      </div>

      {badge && (
        <span className={`text-[10px] px-2 py-1 rounded-full border flex-shrink-0 ${accentColor}`}>
          {badge}
        </span>
      )}
    </motion.button>
  )
}
