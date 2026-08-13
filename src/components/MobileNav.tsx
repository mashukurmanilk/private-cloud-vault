"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Folder,
  Plus,
  Film,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onOpenQuickDrop: () => void;
}

export function MobileNav({ onOpenQuickDrop }: MobileNavProps) {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/", icon: LayoutGrid },
    { label: "Files", href: "/files", icon: Folder },
    { label: "Videos", href: "/videos", icon: Film },
    { label: "Notes", href: "/notes", icon: FileText },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 px-3 py-2 flex items-center justify-around">
      {links.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-1 transition-colors",
              isActive ? "text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={onOpenQuickDrop}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 active:scale-95 transition-transform"
        aria-label="Add"
      >
        <Plus className="w-4 h-4" />
      </button>

      {links.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-1 transition-colors",
              isActive ? "text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
