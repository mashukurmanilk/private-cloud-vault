"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Folder,
  Film,
  Link as LinkIcon,
  FileText,
  Star,
  Plus,
  Play,
  Share2,
  Trash2,
  Pin,
  ExternalLink,
  Upload,
} from "lucide-react";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { LinkModal } from "@/components/LinkModal";
import { ShareModal } from "@/components/ShareModal";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const filterFavorite = searchParams.get("filter") === "favorite";
  const { success, error } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [videoItem, setVideoItem] = useState<any | null>(null);
  const [noteItem, setNoteItem] = useState<any | null>(null);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [linkItem, setLinkItem] = useState<any | null>(null);
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`/api/items${filterFavorite ? "?favorite=true" : ""}`),
        fetch("/api/system/info"),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterFavorite]);

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener("vault:refresh", handleRefresh);
    return () => window.removeEventListener("vault:refresh", handleRefresh);
  }, [fetchData]);

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/items/${id}/star`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, isFavorite: data.item.isFavorite } : it))
        );
        success(data.item.isFavorite ? "Starred" : "Unstarred");
      }
    } catch {
      error("Failed to update favorite");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        success("Deleted");
      }
    } catch {
      error("Failed to delete item");
    }
  };

  const handleItemClick = (item: any) => {
    if (item.type === "VIDEO") {
      setVideoItem(item);
    } else if (item.type === "FILE") {
      setPreviewItem(item);
    } else if (item.type === "NOTE") {
      setNoteItem(item);
      setIsNoteEditorOpen(true);
    } else if (item.type === "LINK") {
      setLinkItem(item);
      setIsLinkEditorOpen(true);
    }
  };

  const recentFiles = items.filter((it) => it.type === "FILE" || it.type === "VIDEO").slice(0, 6);
  const pinnedNotes = items.filter((it) => it.type === "NOTE" && it.isPinned);
  const recentNotes = items.filter((it) => it.type === "NOTE" && !it.isPinned).slice(0, 4);
  const recentLinks = items.filter((it) => it.type === "LINK").slice(0, 6);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">
            {filterFavorite ? "Starred Items" : "Overview"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {stats?.counts?.total || 0} items stored · {formatBytes(stats?.storage?.usedBytes || 0)} used
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <span>{stats?.counts?.files || 0} Files</span>
            <span>·</span>
            <span>{stats?.counts?.videos || 0} Videos</span>
            <span>·</span>
            <span>{stats?.counts?.links || 0} Links</span>
            <span>·</span>
            <span>{stats?.counts?.notes || 0} Notes</span>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("vault:open-add", { detail: { tab: "files" } }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Pinned Notes (if any) */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pinned</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleItemClick(note)}
                className="vault-card-interactive p-4 rounded-xl cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-medium text-xs text-zinc-200 truncate">{note.title}</h3>
                    <Pin className="w-3 h-3 text-zinc-400 shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-3 font-mono leading-relaxed">
                    {note.content || "Empty note"}
                  </p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono pt-1">
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Files */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Recent Files & Media
          </h2>
          <a href="/files" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            View all →
          </a>
        </div>

        {recentFiles.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
            <p className="text-xs text-zinc-500">No files uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentFiles.map((file) => {
              const cat = getFileCategory(file.mimeType, file.originalName);
              const isVid = file.type === "VIDEO";

              return (
                <div
                  key={file.id}
                  onClick={() => handleItemClick(file)}
                  className="vault-card-interactive group rounded-xl p-2.5 flex flex-col justify-between cursor-pointer space-y-2"
                >
                  <div className="w-full aspect-square rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                    {cat === "image" ? (
                      <img
                        src={`/api/files/stream/${file.id}`}
                        alt={file.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : isVid ? (
                      <Film className="w-6 h-6 text-zinc-400" />
                    ) : (
                      <Folder className="w-6 h-6 text-zinc-500" />
                    )}

                    <button
                      onClick={(e) => handleToggleFavorite(file.id, e)}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-zinc-950/70 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <Star
                        className={`w-3 h-3 ${file.isFavorite ? "text-zinc-100 fill-zinc-100" : ""}`}
                      />
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-200 truncate" title={file.title}>
                      {file.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookmarks & Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookmarks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Bookmarks
            </h2>
            <a href="/links" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              View all →
            </a>
          </div>

          {recentLinks.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">No bookmarks saved yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  onClick={() => handleItemClick(link)}
                  className="vault-card-interactive px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-4 h-4 rounded shrink-0 overflow-hidden">
                      {link.favicon ? (
                        <img src={link.favicon} alt="" className="w-4 h-4 object-contain" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-zinc-300 truncate">
                      {link.title}
                    </span>
                  </div>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Recent Notes
            </h2>
            <a href="/notes" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              View all →
            </a>
          </div>

          {recentNotes.length === 0 && pinnedNotes.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">No notes written yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleItemClick(note)}
                  className="vault-card-interactive px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="text-xs font-medium text-zinc-300 truncate">
                      {note.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FilePreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onShare={(it) => setShareItem(it)}
        onDelete={handleDeleteItem}
      />

      <VideoPlayerModal
        item={videoItem}
        isOpen={!!videoItem}
        onClose={() => setVideoItem(null)}
        onShare={(it) => setShareItem(it)}
        onDelete={handleDeleteItem}
      />

      <NoteEditorModal
        note={noteItem}
        isOpen={isNoteEditorOpen}
        onClose={() => {
          setIsNoteEditorOpen(false);
          setNoteItem(null);
        }}
        onSaveSuccess={fetchData}
        onDelete={handleDeleteItem}
        onShare={(it) => setShareItem(it)}
      />

      <LinkModal
        item={linkItem}
        isOpen={isLinkEditorOpen}
        onClose={() => {
          setIsLinkEditorOpen(false);
          setLinkItem(null);
        }}
        onSaveSuccess={fetchData}
        onDelete={handleDeleteItem}
        onShare={(it) => setShareItem(it)}
      />

      <ShareModal
        item={shareItem}
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
      />
    </div>
  );
}
