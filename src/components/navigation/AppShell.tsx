"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";

const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password", "/change-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <main className="flex-grow flex flex-col overflow-hidden bg-zinc-50">
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center px-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Operations</span>
            <span>/</span>
            <span className="text-zinc-900">{getPageTitle(pathname)}</span>
          </div>
        </header>
        <div className="flex-grow overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  return segments[segments.length - 1]
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
