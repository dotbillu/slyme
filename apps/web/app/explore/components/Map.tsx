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
import {
  useEffect,
  useState,
  useRef,
  memo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import L from "leaflet";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";

function createAvatarIcon(avatarUrl: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 52px; height: 52px; border-radius: 50%;
        border: 3px solid #22c55e;
        overflow: hidden; background: #27272a;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        <img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
    popupAnchor: [0, -52],
  });
}

const fallbackIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 52px; height: 52px; border-radius: 50%;
      border: 3px solid #22c55e;
      background: #22c55e; display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  `,
  iconSize: [52, 52],
  iconAnchor: [26, 52],
  popupAnchor: [0, -52],
});

function createGigIcon(avatarUrl?: string | null) {
  if (avatarUrl) {
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px solid #3b82f6;
          overflow: hidden; background: #27272a;
          box-shadow: 0 2px 8px rgba(59,130,246,0.4);
        ">
          <img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  }
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 30px; height: 30px; border-radius: 50%;
        border: 2px solid #3b82f6;
        background: #3b82f6; display: flex;
        align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(59,130,246,0.4);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

function createRoomIcon(imageUrl?: string | null) {
  if (imageUrl) {
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width: 38px; height: 38px; border-radius: 50%;
          border: 3px solid #a855f7;
          overflow: hidden; background: #27272a;
          box-shadow: 0 2px 8px rgba(168,85,247,0.4);
        ">
          <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
  }
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 38px; height: 38px; border-radius: 50%;
        border: 3px solid #a855f7;
        background: #a855f7; display: flex;
        align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(168,85,247,0.4);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

/**
 * Handles initial fly-to and invalidateSize on mount only.
 * Does NOT interfere with zoom/pan events.
 */
function MapSetup({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasMoved = useRef(false);

  useEffect(() => {
    // Only fly once on initial mount
    if (!hasMoved.current) {
      hasMoved.current = true;
      // Small delay to let tiles start loading first
      setTimeout(() => {
        map.invalidateSize();
        map.setView([lat, lng], 15, { animate: false });
      }, 50);
    }
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

const Map = memo(
  forwardRef<MapHandle, MapProps>(function Map(
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
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom={true}
        wheelDebounceTime={40}
        wheelPxPerZoomLevel={60}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#000000" }}
        ref={(map) => {
          if (map && !mapInstance) setMapInstance(map);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {userLocation && (
          <>
            <MapSetup lat={userLocation.lat} lng={userLocation.lng} />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={icon} zIndexOffset={100}>
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
              zIndexOffset={500}
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
              zIndexOffset={300}
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
  }),
);

export default Map;
