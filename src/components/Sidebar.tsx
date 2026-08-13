"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Folder,
  Film,
  Link as LinkIcon,
  FileText,
  Star,
  Settings,
  Plus,
  Lock,
  HardDrive,
  LayoutGrid,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface SidebarProps {
  onOpenQuickDrop: () => void;
  onLock: () => void;
}

export function Sidebar({ onOpenQuickDrop, onLock }: SidebarProps) {
  const pathname = usePathname();
  const [storageData, setStorageData] = useState<{ usedBytes: number; fileCount: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/system/info");
        if (res.ok) {
          const data = await res.json();
          setStorageData(data.storage);
        }
      } catch (err) {
        console.error("Failed to load storage stats:", err);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutGrid },
    { label: "Files", href: "/files", icon: Folder },
    { label: "Videos", href: "/videos", icon: Film },
    { label: "Links", href: "/links", icon: LinkIcon },
    { label: "Notes", href: "/notes", icon: FileText },
    { label: "Starred", href: "/?filter=favorite", icon: Star },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen border-r border-zinc-800/80 bg-zinc-950/50 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-xs">V</span>
          </div>
          <span className="font-semibold text-sm text-zinc-100 tracking-tight">Vault</span>
        </Link>

        <button
          onClick={onLock}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          title="Lock Screen"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenQuickDrop}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/" && !window?.location?.search?.includes("filter=favorite")
              : item.href.includes("favorite")
              ? pathname === "/" && typeof window !== "undefined" && window.location.search.includes("filter=favorite")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              )}
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Storage Footer */}
      <div className="p-4 border-t border-zinc-800/80 text-xs space-y-2">
        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
          <span>Storage</span>
          <span className="font-mono text-zinc-300">
            {formatBytes(storageData?.usedBytes || 0)}
          </span>
        </div>
        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
          <div
            className="bg-zinc-300 h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(3, ((storageData?.usedBytes || 0) / (50 * 1024 * 1024 * 1024)) * 100))}%`,
            }}
          />
        </div>
      </div>
    </aside>
  );
}
