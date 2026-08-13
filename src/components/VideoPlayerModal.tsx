"use client";

import React, { useRef } from "react";
import {
  X,
  Download,
  Share2,
  Trash2,
} from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";

interface VideoPlayerModalProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (item: any) => void;
  onDelete: (id: string) => void;
}

export function VideoPlayerModal({
  item,
  isOpen,
  onClose,
  onShare,
  onDelete,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen || !item) return null;

  const streamUrl = `/api/files/stream/${item.id}`;
  const downloadUrl = `/api/files/download/${item.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="truncate pr-3">
            <h2 className="text-xs font-medium text-zinc-100 truncate">{item.title}</h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {formatBytes(item.size)} · {formatDate(item.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-zinc-200 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </a>

            <button
              onClick={() => onShare(item)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Delete "${item.title}"?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="bg-black flex items-center justify-center min-h-[250px] max-h-[70vh]">
          <video
            ref={videoRef}
            src={streamUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[68vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
