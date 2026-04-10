import { API_BASE } from "@/lib/config";

export async function authSignIn(cred: string, password: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/signin/credentials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cred,
      password,
    }),
  });

  const data = await res.json();
  console.log(data);

  return data;
}
export async function authSignUp({
  name,
  username,
  email,
  password,
}: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/signup/credentials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      username,
      email,
      password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Signup failed");
  }

  return data;
}
