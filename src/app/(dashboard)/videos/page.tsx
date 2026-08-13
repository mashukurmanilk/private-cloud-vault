"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Film,
  Play,
  Search,
  Star,
} from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { ShareModal } from "@/components/ShareModal";
import { useToast } from "@/components/Toast";

export default function VideosPage() {
  const { success, error } = useToast();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [shareItem, setShareItem] = useState<any | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/items?type=VIDEO");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.items || []);
      }
    } catch (err) {
      console.error("Fetch videos error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    const handleRefresh = () => fetchVideos();
    window.addEventListener("vault:refresh", handleRefresh);
    return () => window.removeEventListener("vault:refresh", handleRefresh);
  }, [fetchVideos]);

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/items/${id}/star`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setVideos((prev) =>
          prev.map((it) => (it.id === id ? { ...it, isFavorite: data.item.isFavorite } : it))
        );
        success(data.item.isFavorite ? "Starred" : "Unstarred");
      }
    } catch {
      error("Failed to star video");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVideos((prev) => prev.filter((it) => it.id !== id));
        success("Deleted");
      }
    } catch {
      error("Failed to delete video");
    }
  };

  const filteredVideos = videos.filter((v) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return v.title?.toLowerCase().includes(q) || v.tags?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Videos</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{filteredVideos.length} videos</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("vault:open-add", { detail: { tab: "files" } }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium whitespace-nowrap transition-colors"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-500">No videos in vault.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className="vault-card-interactive group rounded-xl overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              <div className="relative w-full aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
                <video
                  src={`/api/files/stream/${video.id}#t=0.5`}
                  preload="metadata"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                  <div className="w-10 h-10 rounded-full bg-zinc-950/80 text-zinc-100 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-zinc-100 ml-0.5" />
                  </div>
                </div>

                <button
                  onClick={(e) => handleToggleFavorite(video.id, e)}
                  className="absolute top-2 right-2 p-1 rounded bg-zinc-950/70 text-zinc-400 hover:text-zinc-100 transition-colors z-10"
                >
                  <Star
                    className={`w-3 h-3 ${video.isFavorite ? "text-zinc-100 fill-zinc-100" : ""}`}
                  />
                </button>
              </div>

              <div className="p-3">
                <h3 className="font-medium text-xs text-zinc-200 truncate" title={video.title}>
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>{formatBytes(video.size)}</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <VideoPlayerModal
        item={activeVideo}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        onShare={(it) => setShareItem(it)}
        onDelete={handleDelete}
      />

      <ShareModal
        item={shareItem}
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
      />
    </div>
  );
}
