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

export async function sendRecoveryOtp(
  cred: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/auth/recover/get-otp/${cred}`, {
    method: "POST",
  });
  return handleResponse(res);
}

export async function verifyRecoveryOtp(
  cred: string,
  otp: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/recover/verify-otp/${cred}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp }),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function resetPasswordRecover(
  cred: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/recover/reset-password/${cred}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
}

export async function signout(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/signout`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(res);
}
