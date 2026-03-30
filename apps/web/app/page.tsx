"use client";

import { GoogleLogin } from "@react-oauth/google";

export default function Home() {

  const handleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse.credential;

    await fetch("http://localhost:3001/auth/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log("Login Failed")}
      />
    </div>
  );
}
