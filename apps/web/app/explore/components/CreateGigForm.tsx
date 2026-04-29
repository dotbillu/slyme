"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, MapPin, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { CreateGigPayload, GIG_TYPES } from "@/types/gig";
import { createGig } from "@/services/gig/service";

function toLocalDatetimeString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface CreateGigFormProps {
  onClose: () => void;
  currentLocation: { lat: number; lng: number } | null;
  currentLocationName: string;
  onOpenLocationPicker: () => void;
  pickedLocation: { lat: number; lng: number } | null;
  pickedLocationName: string;
}

const inputClass =
  "w-full p-3 rounded-xl bg-zinc-800 text-white text-sm outline-none focus:ring-1 focus:ring-green-500/50";

/* ─── Step 1: Details ─── */
function StepDetails({ form, handleChange }: { form: any; handleChange: any }) {
  return (
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
    </div>
  );
}

/* ─── Step 2: Time & Location ─── */
function StepSchedule({
  form, handleChange, location, locationName, onOpenLocationPicker,
}: {
  form: any; handleChange: any;
  location: { lat: number; lng: number } | null;
  locationName: string;
  onOpenLocationPicker: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-zinc-400 text-xs">Gig Time</label>
        <input type="datetime-local" name="gigTime" value={form.gigTime} onChange={handleChange} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-zinc-400 text-xs">Expires At</label>
        <input type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={handleChange} className={inputClass} />
      </div>

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
            onClick={onOpenLocationPicker}
            className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0"
            aria-label="Edit location"
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
  );
}

/* ─── Step indicator dots ─── */
function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? "w-6 bg-green-400" : "w-1.5 bg-zinc-600"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Slide animation variants ─── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function CreateGigForm({
  onClose, currentLocation, currentLocationName,
  onOpenLocationPicker, pickedLocation, pickedLocationName,
}: CreateGigFormProps) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    title: "", description: "", reward: "",
    gigTime: toLocalDatetimeString(now),
    expiresAt: toLocalDatetimeString(tomorrow),
    imageUrl: "", type: GIG_TYPES[0] as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const location = pickedLocation || currentLocation;
  const locationName = pickedLocationName || currentLocationName;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const goNext = () => {
    if (step === 0 && !form.title.trim()) { setError("Title is required"); return; }
    setError(null);
    setDirection(1);
    setStep(1);
  };

  const goBack = () => { setDirection(-1); setStep(0); };

  const handleSubmit = async () => {
    if (!location) { setError("Location is required"); return; }
    setLoading(true);
    setError(null);
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
      };
      await createGig(payload);
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create gig");
    } finally { setLoading(false); }
  };

  const sharedProps = {
    form, handleChange, location, locationName, onOpenLocationPicker,
    step, direction, goNext, goBack, handleSubmit,
    loading, error, success, onClose,
  };

  return (
    <>
      <div className="hidden md:flex"><DesktopModal {...sharedProps} /></div>
      <div className="md:hidden"><MobileDrawer {...sharedProps} /></div>
    </>
  );
}

/* ─── Desktop: centered modal with steps ─── */
function DesktopModal(props: any) {
  const {
    form, handleChange, location, locationName, onOpenLocationPicker,
    step, direction, goNext, goBack, handleSubmit,
    loading, error, success, onClose,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 md:left-[70px] z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          {step === 0 ? (
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm w-16">Cancel</button>
          ) : (
            <button onClick={goBack} className="text-zinc-400 hover:text-white text-sm w-16 flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <h2 className="text-sm font-semibold text-white">
            {step === 0 ? "New Gig" : "Schedule"}
          </h2>
          {step === 0 ? (
            <button onClick={goNext} className="text-sm font-semibold text-green-400 hover:text-green-300 w-16 text-right flex items-center justify-end gap-1">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={loading || success}
              className="text-sm font-semibold text-green-400 hover:text-green-300 disabled:opacity-50 w-16 text-right"
            >
              {loading ? <Loader2 size={14} className="animate-spin inline" /> : success ? "Done" : "Share"}
            </motion.button>
          )}
        </div>

        {/* Step dots */}
        <div className="pt-4 px-5">
          <StepDots step={step} />
        </div>

        {/* Body with slide animation */}
        <div className="p-5 overflow-hidden">
          {(error || success) && (
            <div className={`mb-4 p-3 rounded-xl text-xs text-center ${
              success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}>
              {success ? "Gig created!" : error}
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {step === 0 ? (
                <StepDetails form={form} handleChange={handleChange} />
              ) : (
                <StepSchedule
                  form={form} handleChange={handleChange}
                  location={location} locationName={locationName}
                  onOpenLocationPicker={onOpenLocationPicker}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Mobile: bottom drawer with steps ─── */
function MobileDrawer(props: any) {
  const {
    form, handleChange, location, locationName, onOpenLocationPicker,
    step, direction, goNext, goBack, handleSubmit,
    loading, error, success, onClose,
  } = props;
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-black/60"
        onClick={onClose}
      />

      <motion.div
        ref={sheetRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 150 || info.velocity.y > 500) onClose();
        }}
        className="fixed bottom-0 left-0 right-0 z-[1000] bg-zinc-900 rounded-t-2xl flex flex-col"
        style={{ touchAction: "none" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-zinc-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          {step === 0 ? (
            <button onClick={onClose} className="text-zinc-400 text-sm w-14">Cancel</button>
          ) : (
            <button onClick={goBack} className="text-zinc-400 text-sm w-14 flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <h2 className="text-sm font-semibold text-white">
            {step === 0 ? "New Gig" : "Schedule"}
          </h2>
          {step === 0 ? (
            <button onClick={goNext} className="text-sm font-semibold text-green-400 w-14 text-right flex items-center justify-end gap-1">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={loading || success}
              className="text-sm font-semibold text-green-400 disabled:opacity-50 w-14 text-right"
            >
              {loading ? "..." : success ? "Done" : "Share"}
            </motion.button>
          )}
        </div>

        {/* Step dots */}
        <div className="pt-3 px-5">
          <StepDots step={step} />
        </div>

        {/* Body */}
        <div className="p-5 pb-24 overflow-hidden">
          {(error || success) && (
            <div className={`mb-4 p-3 rounded-xl text-xs text-center ${
              success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}>
              {success ? "Gig created!" : error}
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {step === 0 ? (
                <StepDetails form={form} handleChange={handleChange} />
              ) : (
                <StepSchedule
                  form={form} handleChange={handleChange}
                  location={location} locationName={locationName}
                  onOpenLocationPicker={onOpenLocationPicker}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
