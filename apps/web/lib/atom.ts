import { atom } from "jotai";
import { Room } from "@/types/room";

export const roomsAtom = atom<Room[]>([]);
export const roomsLoadedAtom = atom(false);
export const unseenCountAtom = atom(0);
