"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Compass,
  MapPin,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";

type PreviewRoom = Room & {
  screenX: string;
  screenY: string;
  activity: string;
};

type PreviewGig = Gig & {
  screenX: string;
  screenY: string;
};

const previewRooms: PreviewRoom[] = [
  {
    id: "room-creatives",
    name: "Hauz Khas creatives",
    description: "People nearby sharing work, gigs, and weekend plans.",
    latitude: 28.5546,
    longitude: 77.1949,
    type: "Creative",
    imageUrl: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    creatorId: "preview",
    createdBy: {
      id: "preview",
      username: "slyme",
      name: "Slyme",
      avatarUrl: null,
    },
    members: [],
    _count: { members: 46 },
    screenX: "62%",
    screenY: "31%",
    activity: "12 chatting now",
  },
  {
    id: "room-campus",
    name: "Campus afterhours",
    description: "Study help, events, food plans, and late night updates.",
    latitude: 28.5489,
    longitude: 77.2039,
    type: "Campus",
    imageUrl: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    creatorId: "preview",
    createdBy: {
      id: "preview",
      username: "slyme",
      name: "Slyme",
      avatarUrl: null,
    },
    members: [],
    _count: { members: 128 },
    screenX: "38%",
    screenY: "66%",
    activity: "new gig posted",
  },
  {
    id: "room-founders",
    name: "Indie builders",
    description: "Ship updates, quick feedback, and local collaborator calls.",
    latitude: 28.5604,
    longitude: 77.2078,
    type: "Work",
    imageUrl: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    creatorId: "preview",
    createdBy: {
      id: "preview",
      username: "slyme",
      name: "Slyme",
      avatarUrl: null,
    },
    members: [],
    _count: { members: 34 },
    screenX: "72%",
    screenY: "57%",
    activity: "3 rooms linked",
  },
];

const previewGigs: PreviewGig[] = [
  {
    id: "gig-camera",
    title: "Need a camera for tonight",
    description: "Short shoot at a cafe. Bring your kit, split edits after.",
    latitude: 28.5534,
    longitude: 77.2018,
    date: "2026-05-31T19:00:00.000Z",
    reward: "Paid",
    gigTime: "2026-05-31T19:00:00.000Z",
    expiresAt: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    creatorId: "preview",
    roomId: "room-creatives",
    type: "Photography",
    imageUrls: [],
    screenX: "52%",
    screenY: "47%",
  },
  {
    id: "gig-food",
    title: "Cafe popup helper",
    description: "Two hour shift near the market.",
    latitude: 28.5581,
    longitude: 77.1907,
    date: "2026-05-31T17:30:00.000Z",
    reward: "₹800",
    gigTime: "2026-05-31T17:30:00.000Z",
    expiresAt: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    creatorId: "preview",
    roomId: null,
    type: "Event Help",
    imageUrls: [],
    screenX: "30%",
    screenY: "42%",
  },
  {
    id: "gig-poster",
    title: "Poster design today",
    description: "Need a quick poster before evening.",
    latitude: 28.5467,
    longitude: 77.1972,
    date: "2026-05-31T16:00:00.000Z",
    reward: "Paid",
    gigTime: "2026-05-31T16:00:00.000Z",
    expiresAt: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    creatorId: "preview",
    roomId: "room-campus",
    type: "Design",
    imageUrls: [],
    screenX: "69%",
    screenY: "69%",
  },
];

const steps = [
  {
    icon: Compass,
    title: "Explore nearby",
    body: "See rooms and gigs pinned around your city, not buried in an endless feed.",
  },
  {
    icon: Plus,
    title: "Drop something",
    body: "Post a gig, create a room, or attach both to a real place people can find.",
  },
  {
    icon: MessageCircle,
    title: "Move to chat",
    body: "Join the room and keep the local conversation going after discovery.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const activeRoom = previewRooms[activeRoomIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveRoomIndex((current) => (current + 1) % previewRooms.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#5cb038]/30 selection:text-white">
      <main className="relative overflow-hidden">
        <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-10 pt-28 sm:px-8 lg:min-h-[860px] lg:px-10 lg:pl-28 lg:pt-24">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400">
                <MapPin size={14} className="text-[#5cb038]" />
                Local map for rooms, gigs, and people nearby
              </div>

              <h1 className="text-5xl font-semibold leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-7xl">
                SLYME puts your city on the map.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
                Find local rooms, discover gigs around you, and jump into the
                conversations that are actually tied to a place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/signin")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#5cb038] px-5 text-sm font-bold text-white shadow-lg shadow-[#5cb038]/15 transition hover:bg-[#4d942e]"
                >
                  Get Started
                  <ArrowRight size={18} />
                </motion.button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-zinc-900 pt-6">
                <Metric value="Geo" label="locked rooms" />
                <Metric value="Live" label="local gigs" />
                <Metric value="Fast" label="room chat" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative min-h-[520px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 lg:min-h-[640px]"
            >
              <div className="absolute inset-x-0 top-0 z-20 flex h-14 items-center border-b border-zinc-800 bg-black/70 px-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Image
                    src="/slymelogo.png"
                    alt="Slyme"
                    width={30}
                    height={30}
                    className="object-contain"
                  />
                  <span className="text-sm font-semibold text-zinc-200">
                    Explore
                  </span>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 top-14 bg-black">
                <div className="pointer-events-none absolute inset-0 bg-[#050505]">
                  <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_center,#3f3f46_1px,transparent_1px)] [background-size:26px_26px]" />
                  <div className="absolute left-[9%] top-[14%] h-[86%] w-[82%] rounded-full border border-zinc-800/70" />
                  <div className="absolute left-[18%] top-[6%] h-[88%] w-[58%] rotate-12 rounded-full border border-zinc-800/50" />
                  <div className="absolute bottom-[20%] left-[-8%] h-px w-[120%] rotate-[-18deg] bg-zinc-800/70" />
                  <div className="absolute left-[18%] top-[-10%] h-[120%] w-px rotate-[18deg] bg-zinc-800/60" />
                  <div className="absolute left-[57%] top-[-10%] h-[120%] w-px rotate-[-8deg] bg-zinc-800/50" />
                  <div className="absolute left-[-10%] top-[35%] h-px w-[120%] rotate-[7deg] bg-zinc-800/50" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#5cb038] bg-[#5cb038]/15 shadow-[0_0_36px_rgba(92,176,56,0.28)]" />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.06)_48%,rgba(0,0,0,0.72)_100%)]" />

                {previewGigs.map((gig) => (
                  <div
                    key={gig.id}
                    className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg shadow-blue-500/20"
                    style={{ left: gig.screenX, top: gig.screenY }}
                  >
                    <MapPin size={11} />
                    {gig.type}
                  </div>
                ))}

                {previewRooms.map((room) => (
                  <div
                    key={`${room.id}-marker`}
                    className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-purple-400 bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                    style={{ left: room.screenX, top: room.screenY }}
                  >
                    <Users size={16} className="m-2" />
                  </div>
                ))}

                {previewRooms.map((room, index) => {
                  const isActive = index === activeRoomIndex;

                  return (
                    <div
                      key={room.id}
                      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: room.screenX, top: room.screenY }}
                    >
                      <div
                        className={`rounded-full border transition-all duration-500 ${
                          isActive
                            ? "h-16 w-16 border-[#5cb038]/70 bg-[#5cb038]/10 shadow-[0_0_36px_rgba(92,176,56,0.35)]"
                            : "h-8 w-8 border-white/10 bg-black/20"
                        }`}
                      />
                      {isActive && (
                        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-[#5cb038]/30" />
                      )}
                    </div>
                  );
                })}

                <div className="absolute bottom-20 left-5 right-5 z-30 sm:bottom-24">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-[#5cb038]">
                          Active room
                        </p>
                        <h2 className="mt-1 text-xl font-medium text-white">
                          {activeRoom.name}
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                          {activeRoom.description}
                        </p>
                      </div>
                      <div className="hidden rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 sm:block">
                        {activeRoom.activity}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {previewRooms.map((room, index) => (
                        <button
                          key={room.id}
                          onClick={() => setActiveRoomIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === activeRoomIndex
                              ? "w-8 bg-[#5cb038]"
                              : "w-2.5 bg-zinc-700 hover:bg-zinc-500"
                          }`}
                          aria-label={`Show ${room.name}`}
                        />
                      ))}
                      <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-zinc-400">
                        <Users size={13} />
                        {activeRoom._count?.members} members
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/explore")}
                  className="absolute right-5 top-5 z-[5000] inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#5cb038]/50 bg-[#5cb038] px-9 text-base font-black uppercase text-white shadow-[0_18px_44px_rgba(92,176,56,0.35)] transition hover:bg-[#4d942e]"
                >
                  Explore
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-zinc-900 bg-zinc-950/60 px-5 py-14 sm:px-8 lg:pl-28">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-xl border border-zinc-800 bg-black p-5"
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-[#5cb038]">
                    <Icon size={19} />
                  </div>
                  <h3 className="text-lg font-medium text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
