import { API_BASE } from "@/lib/config";
import { handleResponse } from "@/services/helper/service";

export const fetchProfile = async (username: string) => {
  const res = await fetch(`${API_BASE}/user/${username}`, {
    cache: "no-store",
  });

  return handleResponse(res);
};

export const updateProfile = async (
  username: string,
  data: { name?: string; bio?: string; avatarUrl?: string; coverImageUrl?: string }
) => {
  const res = await fetch(`${API_BASE}/user/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse(res);
};
