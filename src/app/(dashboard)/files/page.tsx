"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Folder,
  LayoutGrid,
  List,
  Search,
  Download,
  Share2,
  Trash2,
  Star,
  Film,
  FileText,
  Upload,
} from "lucide-react";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { ShareModal } from "@/components/ShareModal";
import { useToast } from "@/components/Toast";

export default function FilesPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [videoItem, setVideoItem] = useState<any | null>(null);
  const [shareItem, setShareItem] = useState<any | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        const filesOnly = (data.items || []).filter(
          (it: any) => it.type === "FILE" || it.type === "VIDEO"
        );
        setItems(filesOnly);
      }
    } catch (err) {
      console.error("Fetch files error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    const handleRefresh = () => fetchFiles();
    window.addEventListener("vault:refresh", handleRefresh);
    return () => window.removeEventListener("vault:refresh", handleRefresh);
  }, [fetchFiles]);

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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        success("File deleted");
      }
    } catch {
      error("Failed to delete file");
    }
  };

  const handleItemClick = (item: any) => {
    if (item.type === "VIDEO") {
      setVideoItem(item);
    } else {
      setPreviewItem(item);
    }
  };

  const filteredItems = items
    .filter((item) => {
      const cat = getFileCategory(item.mimeType, item.originalName);
      if (activeCategory === "IMAGES" && cat !== "image") return false;
      if (activeCategory === "DOCS" && cat !== "doc" && cat !== "pdf") return false;
      if (activeCategory === "AUDIO" && cat !== "audio") return false;
      if (activeCategory === "CODE" && cat !== "code") return false;
      if (activeCategory === "FAVORITES" && !item.isFavorite) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          item.title?.toLowerCase().includes(query) ||
          item.originalName?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "name") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "size") {
        comparison = (b.size || 0) - (a.size || 0);
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

  const categories = [
    { id: "ALL", label: "All" },
    { id: "IMAGES", label: "Images" },
    { id: "DOCS", label: "Documents" },
    { id: "AUDIO", label: "Audio" },
    { id: "CODE", label: "Code" },
    { id: "FAVORITES", label: "Starred" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Files</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{filteredItems.length} files</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("vault:open-add", { detail: { tab: "files" } }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded transition-colors ${
                viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded transition-colors ${
                viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-") as [any, any];
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="name-asc">A-Z</option>
            <option value="size-desc">Largest</option>
          </select>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                activeCategory === cat.id
                  ? "bg-zinc-100 text-zinc-950 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-500">No files found.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredItems.map((file) => {
            const cat = getFileCategory(file.mimeType, file.originalName);

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
                  ) : file.type === "VIDEO" ? (
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
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/60">
          {filteredItems.map((file) => (
            <div
              key={file.id}
              onClick={() => handleItemClick(file)}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-900/50 cursor-pointer text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate pr-4">
                <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-medium text-zinc-300 truncate">{file.title}</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-500 font-mono text-[11px] shrink-0">
                <span>{formatBytes(file.size)}</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <FilePreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onShare={(it) => setShareItem(it)}
        onDelete={handleDelete}
      />

      <VideoPlayerModal
        item={videoItem}
        isOpen={!!videoItem}
        onClose={() => setVideoItem(null)}
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
