"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Library, 
  Award, 
  FileCheck, 
  ShieldAlert, 
  FileText, 
  BarChart, 
  Bell, 
  LifeBuoy, 
  CreditCard, 
  Settings, 
  Activity,
  LogOut,
  Clock
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, isSuperAdmin, signOut } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <aside className="w-64 bg-black text-zinc-300 flex flex-col flex-shrink-0 border-r border-zinc-800">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xs font-black uppercase tracking-widest text-white">Operations Portal</h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Writer&apos;s Thing</p>
      </div>
      
      <nav className="flex-grow overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-3">
          <NavItem href="/" icon={<LayoutDashboard size={14} />} label="Dashboard" active={pathname === "/"} />
          <NavSection title="Community" />
          <NavItem href="/users" icon={<Users size={14} />} label={isSuperAdmin ? "Admin Management" : "Users"} active={pathname === "/users"} />
          <NavItem href="/authors" icon={<BookOpen size={14} />} label="Authors" active={pathname === "/authors"} />
          <NavSection title="Content" />
          <NavItem href="/books" icon={<Library size={14} />} label="Books" active={pathname === "/books"} />
          {isSuperAdmin && (
            <>
              <NavSection title="Founding Writers" />
              <NavItem href="/founding-writers" icon={<LayoutDashboard size={14} />} label="Dashboard" active={pathname === "/founding-writers"} />
              <NavItem href="/founding-writers/list" icon={<Award size={14} />} label="Founder List" active={pathname === "/founding-writers/list"} />
              <NavItem href="/founding-writers/invite" icon={<FileText size={14} />} label="Invite Founder" active={pathname === "/founding-writers/invite"} />
              <NavItem href="/founding-writers/pending" icon={<Clock size={14} />} label="Pending Invitations" active={pathname === "/founding-writers/pending"} />
            </>
          )}
          <NavItem href="/applications" icon={<FileCheck size={14} />} label="Applications" active={pathname === "/applications"} />
          <NavSection title="Management" />
          <NavItem href="/moderation" icon={<ShieldAlert size={14} />} label="Moderation" active={pathname === "/moderation"} />
          <NavItem href="/reports" icon={<FileText size={14} />} label="Reports" active={pathname === "/reports"} />
          <NavItem href="/analytics" icon={<BarChart size={14} />} label="Analytics" active={pathname === "/analytics"} />
          <NavSection title="System" />
          <NavItem href="/notifications" icon={<Bell size={14} />} label="Notifications" active={pathname === "/notifications"} />
          <NavItem href="/support" icon={<LifeBuoy size={14} />} label="Support" active={pathname === "/support"} />
          <NavItem href="/payments" icon={<CreditCard size={14} />} label="Payments" active={pathname === "/payments"} />
          {isSuperAdmin && (
            <NavItem href="/settings" icon={<Settings size={14} />} label="Settings" active={pathname === "/settings"} />
          )}
          <NavItem href="/activity" icon={<Activity size={14} />} label="Activity Logs" active={pathname === "/activity"} />
        </ul>
      </nav>
      
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{user?.full_name || "Loading..."}</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{user?.role_name || ""}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors w-full p-2 rounded-md hover:bg-zinc-800"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-medium tracking-wide transition-all group ${
          active
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`}
      >
        <span className={active ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-300"}>{icon}</span>
        {label}
      </Link>
    </li>
  );
}

function NavSection({ title }: { title: string }) {
  return (
    <li className="pt-4 pb-1 px-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{title}</p>
    </li>
  );
}
