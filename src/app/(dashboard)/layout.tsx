"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { QuickDropModal } from "@/components/QuickDropModal";
import { LockOverlay } from "@/components/LockOverlay";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickDropOpen, setIsQuickDropOpen] = useState(false);
  const [quickDropTab, setQuickDropTab] = useState<"files" | "link" | "note">("files");
  const [isLocked, setIsLocked] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (!data.isSetup) {
        router.replace("/setup");
        return;
      }
      if (!data.authenticated) {
        router.replace("/login");
        return;
      }
      setCurrentUser(data.user);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global Paste listener (Ctrl+V anywhere opens Quick Drop)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.clipboardData && e.clipboardData.items.length > 0) {
        setIsQuickDropOpen(true);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  useEffect(() => {
    const handleOpenAdd = (e: any) => {
      const tab = e.detail?.tab || "files";
      setQuickDropTab(tab);
      setIsQuickDropOpen(true);
    };

    window.addEventListener("vault:open-add", handleOpenAdd);
    return () => window.removeEventListener("vault:open-add", handleOpenAdd);
  }, []);

  const openQuickDrop = (tab: "files" | "link" | "note" = "files") => {
    setQuickDropTab(tab);
    setIsQuickDropOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Sidebar for Desktop */}
      <Sidebar
        onOpenQuickDrop={() => openQuickDrop("files")}
        onLock={() => setIsLocked(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Navbar
          username={currentUser?.username}
          onOpenQuickDrop={openQuickDrop}
          onLock={() => setIsLocked(true)}
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onOpenQuickDrop={() => openQuickDrop("files")} />
      </div>

      {/* Quick Drop & Upload Modal */}
      <QuickDropModal
        isOpen={isQuickDropOpen}
        onClose={() => setIsQuickDropOpen(false)}
        initialTab={quickDropTab}
        onSuccess={() => {
          // Trigger refresh event
          window.dispatchEvent(new CustomEvent("vault:refresh"));
        }}
      />

      {/* Screen Lock Overlay */}
      <LockOverlay
        isLocked={isLocked}
        hasPin={currentUser?.hasPin}
        onUnlock={() => setIsLocked(false)}
      />
    </div>
  );
}
