import React from "react";

export const metadata = {
  title: "Login — Operations Portal",
  description: "Sign in to the Operations Portal",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
