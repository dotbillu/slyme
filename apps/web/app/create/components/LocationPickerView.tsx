"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Search, Loader2, Check } from "lucide-react"
import dynamic from "next/dynamic"
import type { MapHandle } from "@/app/explore/components/Map"

const Map = dynamic(() => import("@/app/explore/components/Map"), { ssr: false })

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

interface LocationPickerViewProps {
  userLocation: { lat: number; lng: number } | null
  avatarUrl: string | null
  initialPicked: { lat: number; lng: number } | null
  onConfirm: (lat: number, lng: number, name: string) => void
  onBack: () => void
}

export default function LocationPickerView({
  userLocation,
  avatarUrl,
  initialPicked,
  onConfirm,
  onBack,
}: LocationPickerViewProps) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    initialPicked || userLocation
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locationName, setLocationName] = useState("")
  const mapRef = useRef<MapHandle>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Reverse geocode
  useEffect(() => {
    if (!picked) return
    const controller = new AbortController()
    async function reverseGeocode() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${picked!.lat}&lon=${picked!.lng}&zoom=18`,
          { signal: controller.signal }
        )
        const data = await res.json()
        if (data.display_name) setLocationName(data.display_name)
      } catch {}
    }
    reverseGeocode()
    return () => controller.abort()
  }, [picked])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) { setSearchResults([]); return }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        )
        const data: SearchResult[] = await res.json()
        setSearchResults(data)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setPicked({ lat, lng })
    setLocationName(result.display_name)
    setSearchQuery("")
    setSearchResults([])
    mapRef.current?.flyTo(lat, lng)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setPicked({ lat, lng })
    mapRef.current?.flyTo(lat, lng)
  }

  const handleConfirm = () => {
    if (picked) onConfirm(picked.lat, picked.lng, locationName)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-black md:ml-[70px]">
      {/* Top bar */}
      <div className="relative z-[1001] p-3 flex flex-col gap-2 bg-zinc-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
            <Search size={16} className="text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a location..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-500"
              autoFocus
            />
            {searching && <Loader2 size={14} className="text-zinc-400 animate-spin" />}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="flex flex-col bg-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectSearchResult(r)}
                className="text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition border-b border-zinc-700/50 last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          userLocation={userLocation}
          avatarUrl={avatarUrl}
          locationPickerMode
          pickedLocation={picked}
          onLocationSelect={handleMapClick}
        />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-xs text-zinc-400">Tap on the map to pick a location</p>
        </div>
      </div>

      {/* Bottom confirm */}
      <div className="relative z-[1001] p-4 bg-zinc-900/95 backdrop-blur-sm">
        {locationName && (
          <p className="text-xs text-zinc-400 mb-2 truncate">{locationName}</p>
        )}
        {picked && (
          <p className="text-[10px] text-zinc-600 mb-3">
            {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
          </p>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          disabled={!picked}
          className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition"
        >
          <Check size={16} />
          Confirm Location
        </motion.button>
      </div>
    </div>
  )
}
