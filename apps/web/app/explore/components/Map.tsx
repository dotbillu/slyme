"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";

function createAvatarIcon(avatarUrl: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 44px; height: 44px; border-radius: 50%;
        border: 3px solid #22c55e;
        overflow: hidden; background: #27272a;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        <img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

const fallbackIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid #22c55e;
      background: #22c55e; display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

function createGigIcon(avatarUrl?: string | null) {
  if (avatarUrl) {
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid #3b82f6;
          overflow: hidden; background: #27272a;
          box-shadow: 0 2px 8px rgba(59,130,246,0.4);
        ">
          <img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  }
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        border: 2px solid #3b82f6;
        background: #3b82f6; display: flex;
        align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(59,130,246,0.4);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function createRoomIcon(imageUrl?: string | null) {
  if (imageUrl) {
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid #a855f7;
          overflow: hidden; background: #27272a;
          box-shadow: 0 2px 8px rgba(168,85,247,0.4);
        ">
          <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  }
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 40px; height: 40px; border-radius: 50%;
        border: 3px solid #a855f7;
        background: #a855f7; display: flex;
        align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(168,85,247,0.4);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

// Removed custom CtrlWheelZoom as it caused severe animation lag on trackpads/wheels.
// Leaflet's native scrollWheelZoom handles this much more efficiently.

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

function LocationPickerEvents({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface MapHandle {
  flyTo: (lat: number, lng: number) => void;
}

interface MapProps {
  userLocation: { lat: number; lng: number } | null;
  avatarUrl: string | null;
  gigs?: Gig[];
  rooms?: Room[];
  onGigClick?: (gig: Gig) => void;
  onRoomClick?: (room: Room) => void;
  locationPickerMode?: boolean;
  pickedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
}

const pickerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #ef4444;
      background: #ef4444; display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(239,68,68,0.5);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const Map = forwardRef<MapHandle, MapProps>(function Map(
  {
    userLocation,
    avatarUrl,
    gigs,
    rooms,
    onGigClick,
    onRoomClick,
    locationPickerMode,
    pickedLocation,
    onLocationSelect,
  },
  ref,
) {
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number) => {
      mapInstance?.flyTo([lat, lng], 15, { duration: 1.2 });
    },
  }));

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [51.505, -0.09];

  const icon = avatarUrl ? createAvatarIcon(avatarUrl) : fallbackIcon;

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      zoomControl={false}
      preferCanvas={true}
      style={{ height: "100%", width: "100%" }}
      ref={(map) => {
        if (map) setMapInstance(map);
      }}
      whenReady={() => setMapReady(true)}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        keepBuffer={12}
        updateWhenZooming={false}
        updateWhenIdle={true}
      />

      {userLocation && mapReady && (
        <>
          <FlyToLocation lat={userLocation.lat} lng={userLocation.lng} />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={icon}>
            <Popup>
              <span style={{ color: "#000" }}>You are here</span>
            </Popup>
          </Marker>
        </>
      )}

      {/* Gig markers */}
      {gigs?.map((gig) => {
        if (!gig.latitude || !gig.longitude) return null;
        const gigImage = gig.imageUrls?.[0] || gig.createdBy?.avatarUrl;
        const gigIcon = createGigIcon(gigImage);
        return (
          <Marker
            key={gig.id}
            position={[gig.latitude, gig.longitude]}
            icon={gigIcon}
            eventHandlers={{
              click: () => onGigClick?.(gig),
            }}
          >
            <Popup>
              <div style={{ color: "#000", maxWidth: 180 }}>
                <strong style={{ fontSize: 13 }}>{gig.title}</strong>
                {gig.reward && (
                  <p style={{ fontSize: 11, margin: "4px 0 0" }}>
                    {gig.reward}
                  </p>
                )}
                {gig.createdBy && (
                  <p style={{ fontSize: 10, color: "#666", margin: "4px 0 0" }}>
                    by {gig.createdBy.username || gig.createdBy.name}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Room markers */}
      {rooms?.map((room) => {
        if (!room.latitude || !room.longitude) return null;
        const roomIcon = createRoomIcon(room.imageUrl);
        return (
          <Marker
            key={`room-${room.id}`}
            position={[room.latitude, room.longitude]}
            icon={roomIcon}
            eventHandlers={{
              click: () => onRoomClick?.(room),
            }}
          >
            <Popup>
              <div style={{ color: "#000", maxWidth: 180 }}>
                <strong style={{ fontSize: 13 }}>{room.name}</strong>
                {room.description && (
                  <p style={{ fontSize: 11, margin: "4px 0 0" }}>
                    {room.description}
                  </p>
                )}
                <p style={{ fontSize: 10, color: "#666", margin: "4px 0 0" }}>
                  {room._count?.members || room.members?.length || 0} members
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {locationPickerMode && onLocationSelect && (
        <LocationPickerEvents onLocationSelect={onLocationSelect} />
      )}

      {pickedLocation && (
        <Marker
          position={[pickedLocation.lat, pickedLocation.lng]}
          icon={pickerIcon}
        >
          <Popup>
            <span style={{ color: "#000" }}>Gig location</span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
});

export default Map;
