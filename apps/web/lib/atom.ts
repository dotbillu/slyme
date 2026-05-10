import { atom } from "jotai";
import { Room } from "@/types/room";
import { Gig } from "@/types/gig";
import { UserPublic } from "@/types/user";

// Network page
export const roomsAtom = atom<Room[]>([]);
export const roomsLoadedAtom = atom(false);
export const unseenCountAtom = atom(0);

// Explore page
export const exploreGigsAtom = atom<Gig[]>([]);
export const exploreGigsLoadedAtom = atom(false);
export const exploreRoomsAtom = atom<Room[]>([]);
export const exploreRoomsLoadedAtom = atom(false);

// Profile page
export const currentUserProfileAtom = atom<UserPublic | null>(null);
