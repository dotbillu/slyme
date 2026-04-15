import { API_BASE } from "@/lib/config";
import { handleResponse } from "@/services/helper/service";

export const fetchProfile = async (username: string) => {
  const res = await fetch(`${API_BASE}/user/${username}`, {
    cache: "no-store",
  });

  return handleResponse(res);
};
