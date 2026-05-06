"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, MapPin, Pencil, Loader2, Check } from "lucide-react"
import { useAuth } from "@/app/AuthProvider"
import { CreateGigPayload, GIG_TYPES } from "@/types/gig"
import { createGig } from "@/services/gig/service"
import LocationPickerView from "../components/LocationPickerView"

type View = "form" | "locationPicker"

const inputClass =
  "w-full p-3 rounded-xl bg-zinc-800 text-white text-sm outline-none focus:ring-1 focus:ring-green-500/50"

function toLocalDatetimeString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function CreateGigPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<View>("form")

  // Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLocationName, setCurrentLocationName] = useState("")
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [pickedLocationName, setPickedLocationName] = useState("")

  // Form
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
    gigTime: toLocalDatetimeString(now),
    expiresAt: toLocalDatetimeString(tomorrow),
    imageUrl: "",
    type: GIG_TYPES[0] as string,
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
    setView("form")
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return }
    if (!location) { setError("Location is required"); return }
    setLoading(true)
    setError(null)
    try {
      const payload: CreateGigPayload = {
        title: form.title,
        description: form.description || undefined,
        reward: form.reward || undefined,
        gigTime: new Date(form.gigTime).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
        imageUrls: form.imageUrl ? [form.imageUrl] : undefined,
        type: form.type,
        latitude: location.lat,
        longitude: location.lng,
      }
      await createGig(payload)
      setSuccess(true)
      setTimeout(() => router.push("/explore"), 1000)
    } catch (err: any) {
      setError(err.message || "Failed to create gig")
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
        onBack={() => setView("form")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black text-white md:ml-[70px] pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-800 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">New Gig</h1>
          <div className="w-9" />
        </div>

        {/* Error / Success */}
        {(error || success) && (
          <div className={`mb-4 p-3 rounded-xl text-xs text-center ${
            success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {success ? "Gig created!" : error}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-xs">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="What's the gig?"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-xs">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the gig..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-xs">Reward</label>
              <input
                name="reward"
                value={form.reward}
                onChange={handleChange}
                placeholder="$50, Pizza, etc."
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-xs">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className={`${inputClass} appearance-none`}>
                {GIG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-xs">Gig Time</label>
              <input type="datetime-local" name="gigTime" value={form.gigTime} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-xs">Expires At</label>
              <input type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-xs">Image URL</label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-xs">Location</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-zinc-800 text-sm min-w-0">
                <MapPin size={14} className="text-green-400 shrink-0" />
                <span className="text-white truncate text-xs">
                  {locationName || "Fetching location..."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setView("locationPicker")}
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0"
                aria-label="Pick location on map"
              >
                <Pencil size={16} />
              </button>
            </div>
            {location && (
              <p className="text-[10px] text-zinc-600 mt-1">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading || success}
          className="w-full mt-6 p-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2 transition bg-green-500 hover:bg-green-600"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : success ? (
            "Done!"
          ) : (
            <>
              <Check size={16} />
              Create Gig
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
