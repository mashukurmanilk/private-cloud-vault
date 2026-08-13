"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Lock,
  LogOut,
  ChevronDown,
  Upload,
  Link as LinkIcon,
  FileText,
  Smartphone,
} from "lucide-react";
import { useToast } from "./Toast";

interface NavbarProps {
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
  onOpenQuickDrop: (tab?: "files" | "link" | "note") => void;
  onLock: () => void;
  username?: string;
}

export function Navbar({
  onSearchChange,
  searchTerm = "",
  onOpenQuickDrop,
  onLock,
  username = "User",
}: NavbarProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        success("Logged out");
        window.location.href = "/login";
      }
    } catch {
      error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Search Input */}
      <div className="flex-1 max-w-sm relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-zinc-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Mobile Quick Add */}
        <button
          onClick={() => onOpenQuickDrop()}
          className="md:hidden p-1.5 rounded-lg bg-zinc-100 text-zinc-900"
          title="Add"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Quick Add Dropdown (Desktop) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>New</span>
            <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-zinc-900 border border-zinc-800 p-1 z-40 shadow-xl">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenQuickDrop("files");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenQuickDrop("link");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Save Link</span>
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenQuickDrop("note");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Write Note</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lock Screen */}
        <button
          onClick={onLock}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Lock"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-zinc-800 text-zinc-200 flex items-center justify-center font-bold text-[10px]">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline font-medium text-zinc-300">{username}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-zinc-900 border border-zinc-800 p-1 z-40 shadow-xl">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Device Sync</span>
                </button>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
