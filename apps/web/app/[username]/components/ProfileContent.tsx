"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { UserPublic } from "@/types/user";
import { MapPin, Calendar, Award, Tag, Pencil, Camera, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/app/AuthProvider";
import { updateProfile } from "@/services/user/service";

type Tab = "recent" | "gigs" | "rooms";

function formatDate(d: Date | string | null) {
  if (!d) return "no date";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Upload failed")
  }
  const data = await res.json()
  return data.url
}

function GigCard({ gig, onClick }: { gig: UserPublic["gigs"][number]; onClick: () => void }) {
  return (
    <div onClick={onClick} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition space-y-3 cursor-pointer">
      {/* Image */}
      {gig.imageUrls.length > 0 && (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-zinc-800">
          <img src={gig.imageUrls[0]} alt={gig.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-white leading-tight">{gig.title}</h3>
        {gig.type && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {gig.type}
          </span>
        )}
      </div>

      {/* Description */}
      {gig.description && (
        <p className="text-xs text-zinc-500 line-clamp-2">{gig.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        {gig.reward && (
          <span className="flex items-center gap-1">
            <Award size={11} className="text-green-400" />
            {gig.reward}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={11} className="text-blue-400" />
          {formatDate(gig.date)}
        </span>
      </div>
    </div>
  );
}

export default function ProfileClient({ user: initialUser }: { user: UserPublic }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState<Tab>("recent");
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user: authUser, setUser: setAuthUser } = useAuth();

  const isOwner = authUser?.username === user.username;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    coverImageUrl: user.coverImageUrl || "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("mode") === "edit" && isOwner) {
      setIsEditing(true);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("mode");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, isOwner]);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(true);
      try {
        const url = await uploadFile(e.target.files[0]);
        setForm(prev => ({ ...prev, avatarUrl: url }));
      } catch (err) {
        console.error("Failed to upload avatar", err);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingCover(true);
      try {
        const url = await uploadFile(e.target.files[0]);
        setForm(prev => ({ ...prev, coverImageUrl: url }));
      } catch (err) {
        console.error("Failed to upload cover", err);
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user.username) return;
    setSaving(true);
    try {
      const updatedUser = await updateProfile(user.username, form);
      setUser(updatedUser);
      setAuthUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user.name || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      coverImageUrl: user.coverImageUrl || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-20">
      <div className="h-56 w-full bg-zinc-900 relative group overflow-hidden">
        {(isEditing ? form.coverImageUrl : user.coverImageUrl) && (
          <img
            src={isEditing ? form.coverImageUrl : (user.coverImageUrl || "")}
            className={`w-full h-full object-cover transition ${isEditing ? "opacity-50" : "opacity-80"}`}
            alt=""
          />
        )}
        {isEditing && (
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition"
          >
            {uploadingCover ? <Loader2 className="animate-spin text-white" size={32} /> : <Camera size={32} className="text-white drop-shadow-md" />}
          </div>
        )}
        <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
      </div>

      <div className="max-w-2xl mx-auto px-6">
        <div className="-mt-10 mb-8 relative">
          <div className="flex justify-between items-start">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-black mb-3 bg-zinc-800 relative group shrink-0">
              {(isEditing ? form.avatarUrl : user.avatarUrl) && (
                <img
                  src={isEditing ? form.avatarUrl : (user.avatarUrl || "")}
                  className={`w-full h-full object-cover transition ${isEditing ? "opacity-50" : "opacity-100"}`}
                  alt=""
                />
              )}
              {isEditing && (
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/40 transition bg-black/20"
                >
                  {uploadingAvatar ? <Loader2 className="animate-spin text-white" size={20} /> : <Camera size={20} className="text-white" />}
                </div>
              )}
              <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
            </div>

            {isOwner && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-12 p-2 text-zinc-400 hover:text-white  transition "
              >
                <Pencil size={16} />
              </button>
            )}
            
            {isOwner && isEditing && (
              <div className="mt-12 flex gap-2">
                <button 
                  onClick={handleCancel}
                  disabled={saving}
                  className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition border border-zinc-800 disabled:opacity-50"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving || uploadingAvatar || uploadingCover}
                  className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3 max-w-sm mt-2">
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="Your Name"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              />
              <textarea 
                value={form.bio} 
                onChange={e => setForm(f => ({...f, bio: e.target.value}))}
                placeholder="A short bio..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 resize-none"
              />
            </div>
          ) : (
            <div className="mt-2">
              <h1 className="text-lg font-semibold tracking-tight">
                {user.name || user.username}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {user.bio || "no bio yet"}
              </p>
            </div>
          )}

          <p className="text-xs text-zinc-600 mt-3">
            {user.gigs.length} gigs • {user.rooms.length} rooms
          </p>
        </div>

        <div className="flex gap-6 text-sm mb-6 border-b border-zinc-900">
          {(["recent", "gigs", "rooms"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-2 capitalize ${
                tab === t ? "text-white" : "text-zinc-500"
              }`}
            >
              {t}
              {tab === t && (
                <motion.div
                  layoutId="underline"
                  className="absolute left-0 right-0 -bottom-[1px] h-[1.5px] bg-white"
                />
              )}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "recent" && (
            <div className="space-y-4">
              {[...user.gigs]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((gig) => (
                  <div key={gig.id} className="space-y-1">
                    <p className="text-xs text-zinc-600">
                      posted a gig • {formatDate(gig.createdAt)}
                    </p>
                    <p className="text-sm text-white">{gig.title}</p>
                    {gig.reward && (
                      <p className="text-xs text-green-400">{gig.reward}</p>
                    )}
                  </div>
                ))}
              {user.gigs.length === 0 && (
                <p className="text-sm text-zinc-600">No activity yet</p>
              )}
            </div>
          )}

          {tab === "gigs" && (
            <div className="space-y-3">
              {user.gigs.length === 0 && (
                <p className="text-sm text-zinc-600">No gigs yet</p>
              )}
              {user.gigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} onClick={() => router.push(`/explore?gig=${gig.id}`)} />
              ))}
            </div>
          )}

          {tab === "rooms" && (
            <div className="space-y-4">
              {user.rooms.length === 0 && (
                <p className="text-sm text-zinc-600">No rooms yet</p>
              )}
              {user.rooms.map((room) => (
                <div key={room.id} onClick={() => router.push(`/network/${room.id}`)} className="flex justify-between items-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{room.name}</p>
                    {room.description && (
                      <p className="text-xs text-zinc-500 mt-1">{room.description}</p>
                    )}
                  </div>
                  {room.type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {room.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
