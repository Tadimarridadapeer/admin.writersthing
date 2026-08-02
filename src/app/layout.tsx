import "./globals.css";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/navigation/AppShell";

export const metadata = {
  title: "Writer's Thing Operations",
  description: "Internal Operations Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-50 text-zinc-900">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
