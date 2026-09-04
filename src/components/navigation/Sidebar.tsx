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
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function Sidebar({ isCollapsed = false, toggleCollapse = () => {} }: { isCollapsed?: boolean; toggleCollapse?: () => void }) {
  const pathname = usePathname();
  const { user, isSuperAdmin, signOut } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <aside className={`bg-black text-zinc-300 flex flex-col flex-shrink-0 border-r border-zinc-800 relative transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      
      <button 
        onClick={toggleCollapse} 
        className="absolute -right-3 top-6 bg-zinc-800 border border-zinc-700 text-white p-1 rounded-full z-10 hover:bg-zinc-700 transition-colors hidden md:flex"
        title="Toggle Sidebar"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`border-b border-zinc-800 flex items-center justify-center ${isCollapsed ? 'p-4' : 'p-6'}`}>
        {isCollapsed ? (
          <h1 className="text-xs font-black uppercase text-white">OP</h1>
        ) : (
          <div className="w-full">
            <h1 className="text-xs font-black uppercase tracking-widest text-white">Operations Portal</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Writer&apos;s Thing</p>
          </div>
        )}
      </div>
      
      <nav className="flex-grow overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-2">
          <NavItem href="/" icon={<LayoutDashboard size={14} />} label="Dashboard" active={pathname === "/"} isCollapsed={isCollapsed} />
          <NavSection title="Community" isCollapsed={isCollapsed} />
          <NavItem href="/users" icon={<Users size={14} />} label="Users" active={pathname === "/users"} isCollapsed={isCollapsed} />
          {isSuperAdmin && (
            <NavItem href="/admins" icon={<ShieldAlert size={14} />} label="Admin Management" active={pathname === "/admins"} isCollapsed={isCollapsed} />
          )}
          <NavItem href="/authors" icon={<BookOpen size={14} />} label="Authors" active={pathname === "/authors"} isCollapsed={isCollapsed} />
          <NavSection title="Content" isCollapsed={isCollapsed} />
          <NavItem href="/books" icon={<Library size={14} />} label="Content" active={pathname === "/books"} isCollapsed={isCollapsed} />
          {isSuperAdmin && (
            <>
              <NavSection title="Founding Writers" isCollapsed={isCollapsed} />
              <NavItem href="/founding-writers" icon={<LayoutDashboard size={14} />} label="Dashboard" active={pathname === "/founding-writers"} isCollapsed={isCollapsed} />
              <NavItem href="/founding-writers/list" icon={<Award size={14} />} label="Founder List" active={pathname === "/founding-writers/list"} isCollapsed={isCollapsed} />
              <NavItem href="/founding-writers/invite" icon={<FileText size={14} />} label="Invite Founder" active={pathname === "/founding-writers/invite"} isCollapsed={isCollapsed} />
            </>
          )}
          <NavSection title="Management" isCollapsed={isCollapsed} />
          <NavItem href="/moderation" icon={<ShieldAlert size={14} />} label="Moderation" active={pathname === "/moderation"} isCollapsed={isCollapsed} />
          <NavItem href="/reports" icon={<FileText size={14} />} label="Reports" active={pathname === "/reports"} isCollapsed={isCollapsed} />
          <NavItem href="/analytics" icon={<BarChart size={14} />} label="Analytics" active={pathname === "/analytics"} isCollapsed={isCollapsed} />
          <NavSection title="System" isCollapsed={isCollapsed} />
          <NavItem href="/notifications" icon={<Bell size={14} />} label="Notifications" active={pathname === "/notifications"} isCollapsed={isCollapsed} />
          <NavItem href="/support" icon={<LifeBuoy size={14} />} label="Support" active={pathname === "/support"} isCollapsed={isCollapsed} />
          <NavItem href="/payments" icon={<CreditCard size={14} />} label="Payments" active={pathname === "/payments"} isCollapsed={isCollapsed} />
          {isSuperAdmin && (
            <>
              <NavItem href="/maintenance" icon={<Activity size={14} />} label="Maintenance" active={pathname === "/maintenance"} isCollapsed={isCollapsed} />
              <NavItem href="/settings" icon={<Settings size={14} />} label="Settings" active={pathname === "/settings"} isCollapsed={isCollapsed} />
            </>
          )}
          <NavItem href="/activity" icon={<Activity size={14} />} label="Activity Logs" active={pathname === "/activity"} isCollapsed={isCollapsed} />
        </ul>
      </nav>
      
      <div className={`p-4 border-t border-zinc-800 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex flex-shrink-0 items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{user?.full_name || "Loading..."}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">{user?.role_name || ""}</p>
            </div>
          )}
        </div>
        <button
          onClick={signOut}
          className={`flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800 ${isCollapsed ? 'justify-center w-auto' : 'gap-2 w-full'}`}
          title="Sign Out"
        >
          <LogOut size={14} /> {!isCollapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, isCollapsed }: { href: string; icon: React.ReactNode; label: string; active: boolean; isCollapsed: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center px-3 py-2 rounded-md text-[11px] font-medium tracking-wide transition-all group ${
          isCollapsed ? 'justify-center' : 'gap-3'
        } ${
          active
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`}
        title={isCollapsed ? label : undefined}
      >
        <span className={active ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-300"}>{icon}</span>
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Link>
    </li>
  );
}

function NavSection({ title, isCollapsed }: { title: string; isCollapsed: boolean }) {
  if (isCollapsed) {
    return <li className="pt-4 pb-1 my-2 border-t border-zinc-800"></li>;
  }
  return (
    <li className="pt-4 pb-1 px-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 truncate">{title}</p>
    </li>
  );
}
