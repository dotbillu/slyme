import { API_BASE } from "@/lib/config";
import { handleResponse } from "@/services/helper/service";
import { CreateGigPayload, UpdateGigPayload, Gig } from "@/types/gig";

export async function fetchAllGigs(skip = 0, take = 50): Promise<Gig[]> {
  const res = await fetch(`${API_BASE}/gigs?skip=${skip}&take=${take}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return handleResponse(res);
}

export async function fetchGigById(id: string): Promise<Gig> {
  const res = await fetch(`${API_BASE}/gigs/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}

export async function createGig(payload: CreateGigPayload): Promise<Gig> {
  const res = await fetch(`${API_BASE}/gigs/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function updateGig(id: string, payload: UpdateGigPayload): Promise<Gig> {
  const res = await fetch(`${API_BASE}/gigs/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function deleteGig(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/gigs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(res);
}
