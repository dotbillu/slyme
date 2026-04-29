"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useAuth } from "@/app/AuthProvider";
import { Gig } from "@/types/gig";
import { fetchAllGigs } from "@/services/gig/service";

const Map = dynamic(() => import("@/app/explore/components/Map"), { ssr: false });
const CreateGigForm = dynamic(() => import("@/app/explore/components/CreateGigForm"), { ssr: false });
const LocationPicker = dynamic(() => import("@/app/explore/components/LocationPicker"), { ssr: false });
const GigDetail = dynamic(() => import("@/app/explore/components/GigDetail"), { ssr: false });

type View = "map" | "form" | "locationPicker";

export default function ExplorePage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("map");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState("");
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickedLocationName, setPickedLocationName] = useState("");

  // Gigs state
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  // Fetch all gigs
  const loadGigs = useCallback(async () => {
    try {
      const data = await fetchAllGigs();
      setGigs(data);
    } catch {
      // silently fail — map just won't show gigs
    }
  }, []);

  useEffect(() => { loadGigs(); }, [loadGigs]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18`
          );
          const data = await res.json();
          if (data.display_name) setCurrentLocationName(data.display_name);
        } catch {
          setCurrentLocationName(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
        }
      },
      () => {
        setUserLocation({ lat: 51.505, lng: -0.09 });
        setCurrentLocationName("London, UK");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const handleOpenForm = useCallback(() => setView("form"), []);

  const handleCloseForm = useCallback(() => {
    setView("map");
    setPickedLocation(null);
    setPickedLocationName("");
    loadGigs(); // refresh gigs after creating
  }, [loadGigs]);

  const handleOpenLocationPicker = useCallback(() => setView("locationPicker"), []);

  const handleLocationConfirm = useCallback((lat: number, lng: number, name: string) => {
    setPickedLocation({ lat, lng });
    setPickedLocationName(name);
    setView("form");
  }, []);

  const handleLocationPickerBack = useCallback(() => setView("form"), []);

  // Gig detail handlers
  const handleGigClick = useCallback((gig: Gig) => {
    setSelectedGig(gig);
  }, []);

  const handleGigClose = useCallback(() => {
    setSelectedGig(null);
  }, []);

  const handleGigUpdated = useCallback((updated: Gig) => {
    setGigs((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGig(updated);
  }, []);

  const handleGigDeleted = useCallback((id: string) => {
    setGigs((prev) => prev.filter((g) => g.id !== id));
    setSelectedGig(null);
  }, []);

  const avatarUrl = user?.avatarUrl || null;
  const isOwner = (gig: Gig) => !!user && gig.creatorId === user.id;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Main map */}
      <div className="absolute inset-0">
        <Map
          userLocation={userLocation}
          avatarUrl={avatarUrl}
          gigs={gigs}
          onGigClick={handleGigClick}
        />
      </div>

      {/* Create Gig FAB */}
      {view === "map" && !selectedGig && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenForm}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[997] w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors"
          aria-label="Create a gig"
        >
          <Plus size={24} className="text-white" />
        </motion.button>
      )}

      {/* Gig detail sidebar / fullscreen */}
      <AnimatePresence>
        {selectedGig && (
          <GigDetail
            key={selectedGig.id}
            gig={selectedGig}
            isOwner={isOwner(selectedGig)}
            onClose={handleGigClose}
            onUpdated={handleGigUpdated}
            onDeleted={handleGigDeleted}
          />
        )}
      </AnimatePresence>

      {/* Form overlay — keep mounted during location picker so form state persists */}
      <AnimatePresence>
        {(view === "form" || view === "locationPicker") && (
          <div className={view === "locationPicker" ? "hidden" : ""}>
            <CreateGigForm
              onClose={handleCloseForm}
              currentLocation={userLocation}
              currentLocationName={currentLocationName}
              onOpenLocationPicker={handleOpenLocationPicker}
              pickedLocation={pickedLocation}
              pickedLocationName={pickedLocationName}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Location picker overlay */}
      <AnimatePresence>
        {view === "locationPicker" && (
          <LocationPicker
            currentLocation={userLocation}
            avatarUrl={avatarUrl}
            onConfirm={handleLocationConfirm}
            onBack={handleLocationPickerBack}
            initialPicked={pickedLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
