"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, MapPin, Pencil, Loader2, Check, ImagePlus } from "lucide-react"
import { useAuth } from "@/app/AuthProvider"
import { CreateRoomPayload } from "@/types/room"
import { createRoom } from "@/services/room/service"
import LocationPickerView from "../components/LocationPickerView"

type View = "step1" | "step2" | "locationPicker"

const inputClass =
  "w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition"

const ROOM_TYPES = [
  "Community",
  "Study Group",
  "Sports",
  "Music",
  "Gaming",
  "Food",
  "Travel",
  "Work",
  "Other",
] as const

export default function CreateRoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<View>("step1")

  // Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLocationName, setCurrentLocationName] = useState("")
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [pickedLocationName, setPickedLocationName] = useState("")

  // Form
  const [form, setForm] = useState({
    imageUrl: "",
    name: "",
    description: "",
    type: ROOM_TYPES[0] as string,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18`
          )
          const data = await res.json()
          if (data.display_name) setCurrentLocationName(data.display_name)
        } catch {
          setCurrentLocationName(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`)
        }
      },
      () => {
        setUserLocation({ lat: 51.505, lng: -0.09 })
        setCurrentLocationName("London, UK")
      },
      { enableHighAccuracy: true }
    )
  }, [])

  const location = pickedLocation || userLocation
  const locationName = pickedLocationName || currentLocationName

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLocationConfirm = useCallback((lat: number, lng: number, name: string) => {
    setPickedLocation({ lat, lng })
    setPickedLocationName(name)
    setView("step2")
  }, [])

  const handleNext = () => {
    if (!form.name.trim()) { setError("Room name is required"); return }
    setError(null)
    setView("step2")
  }

  const handleBack = () => {
    setError(null)
    setView("step1")
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Room name is required"); return }
    if (!location) { setError("Location is required"); return }
    setLoading(true)
    setError(null)
    try {
      const payload: CreateRoomPayload = {
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        imageUrl: form.imageUrl || undefined,
        latitude: location.lat,
        longitude: location.lng,
      }
      const room = await createRoom(payload)
      setSuccess(true)
      setTimeout(() => router.push(`/network/${room.id}`), 1000)
    } catch (err: any) {
      setError(err.message || "Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (view === "locationPicker") {
    return (
      <LocationPickerView
        userLocation={userLocation}
        avatarUrl={user.avatarUrl}
        initialPicked={pickedLocation}
        onConfirm={handleLocationConfirm}
        onBack={() => setView("step2")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black text-white md:ml-[70px] pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={view === "step1" ? () => router.back() : handleBack}
            className="p-2 hover:bg-zinc-900 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-base font-semibold">New Room</h1>
            <p className="text-[10px] text-zinc-500">Step {view === "step1" ? "1" : "2"} of 2</p>
          </div>
          <div className="w-9" />
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-purple-500" />
          <div className={`flex-1 h-1 rounded-full transition-colors ${view === "step2" ? "bg-purple-500" : "bg-zinc-800"}`} />
        </div>

        {/* Error / Success */}
        {(error || success) && (
          <div className={`mb-4 p-3 rounded-xl text-xs text-center ${
            success ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {success ? "Room created!" : error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === "step1" ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Image upload — compact */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-medium">Photo</label>
                {form.imageUrl ? (
                  <div className="relative group">
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="w-full h-40 rounded-xl object-cover border border-zinc-800"
                      onError={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                    />
                    <button
                      onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black transition text-white"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/50 cursor-pointer transition group">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
                      <ImagePlus size={18} className="text-zinc-600 group-hover:text-purple-400 transition" />
                    </div>
                    <input
                      type="url"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="Paste a photo URL..."
                      className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
                    />
                  </label>
                )}
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-medium">Room Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name your room"
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-medium">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What's this room about?"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Next button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="w-full mt-2 p-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition bg-purple-500 hover:bg-purple-600"
              >
                Next
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-medium">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none`}
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                  <MapPin size={12} />
                  Location
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm min-w-0">
                    <MapPin size={14} className="text-purple-400 shrink-0" />
                    <span className="text-white truncate text-xs">
                      {locationName || "Fetching location..."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("locationPicker")}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition shrink-0"
                    aria-label="Pick location on map"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                {location && (
                  <p className="text-[10px] text-zinc-600">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading || success}
                className="w-full mt-2 p-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2 transition bg-purple-500 hover:bg-purple-600"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : success ? (
                  "Done!"
                ) : (
                  <>
                    <Check size={16} />
                    Create Room
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
