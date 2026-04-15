import { API_BASE } from "@/lib/config";
import { UserPublic } from "@/types/user";
import { handleResponse } from "../helper/service";
export async function CredentialSignIn(
  cred: string,
  password: string,
): Promise<UserPublic> {
  const res = await fetch(`${API_BASE}/auth/signin/credentials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cred, password }),
  });

  const data = await handleResponse(res);
  return data.user;
}

export async function oauthSignIn(token: string): Promise<UserPublic> {
  const res = await fetch(`${API_BASE}/auth/signin/oauth`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const data = await handleResponse(res);
  return data.user;
}
export async function oauthEmailVerify(
  token: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/signup/oauth/email-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  return handleResponse(res);
}

export async function oauthSignUpUser(
  token: string,
  username: string,
): Promise<UserPublic> {
  const res = await fetch(`${API_BASE}/auth/signup/oauth/create-user`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, username }),
  });

  const data = await handleResponse(res);
  return data.user;
}
export async function CredentialSignUp({
  name,
  username,
  email,
  password,
}: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<UserPublic> {
  const res = await fetch(`${API_BASE}/auth/signup/credentials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, username, email, password }),
  });

  const data = await handleResponse(res);
  return data.user;
}
export async function getMe(): Promise<UserPublic> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}
