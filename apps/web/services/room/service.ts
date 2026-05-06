import { API_BASE } from "@/lib/config";
import { handleResponse } from "@/services/helper/service";
import { Room, RoomWithMessages, Message, CreateRoomPayload } from "@/types/room";

export async function fetchAllRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/rooms/all`, {
    method: "GET",
    cache: "no-store",
  });

  return handleResponse(res);
}

export async function fetchUserRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return handleResponse(res);
}

export async function fetchRoomById(id: string): Promise<RoomWithMessages> {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}

export async function fetchRoomMessages(
  id: string,
  skip = 0,
  take = 50
): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/rooms/${id}/messages?skip=${skip}&take=${take}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function joinRoom(id: string): Promise<Room> {
  const res = await fetch(`${API_BASE}/rooms/${id}/join`, {
    method: "POST",
    credentials: "include",
  });

  return handleResponse(res);
}

export async function deleteRoom(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(res);
}
