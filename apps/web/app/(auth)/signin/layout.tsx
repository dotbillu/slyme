import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signin | Slyme",
  description: "Sign in to your Slyme account.",
};

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
