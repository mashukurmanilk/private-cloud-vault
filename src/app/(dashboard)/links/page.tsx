"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Search,
  Star,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LinkModal } from "@/components/LinkModal";
import { ShareModal } from "@/components/ShareModal";
import { useToast } from "@/components/Toast";

export default function LinksPage() {
  const { success, error } = useToast();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [activeLink, setActiveLink] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/items?type=LINK");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.items || []);
      }
    } catch (err) {
      console.error("Fetch links error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
    const handleRefresh = () => fetchLinks();
    window.addEventListener("vault:refresh", handleRefresh);
    return () => window.removeEventListener("vault:refresh", handleRefresh);
  }, [fetchLinks]);

  const handleCopyUrl = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    success("Copied");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/items/${id}/star`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLinks((prev) =>
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
        setLinks((prev) => prev.filter((it) => it.id !== id));
        success("Deleted");
      }
    } catch {
      error("Failed to delete bookmark");
    }
  };

  const allTags = Array.from(
    new Set(
      links
        .flatMap((l) => (l.tags ? l.tags.split(",").map((t: string) => t.trim()) : []))
        .filter(Boolean)
    )
  );

  const filteredLinks = links.filter((item) => {
    if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.tags?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Bookmarks</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{filteredLinks.length} links</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("vault:open-add", { detail: { tab: "link" } }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium whitespace-nowrap transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${
              selectedTag === null
                ? "bg-zinc-100 text-zinc-950 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                selectedTag === tag
                  ? "bg-zinc-100 text-zinc-950 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks List */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-500">No bookmarks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              onClick={() => {
                setActiveLink(link);
                setIsEditorOpen(true);
              }}
              className="vault-card-interactive group rounded-xl p-3.5 cursor-pointer flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-4 h-4 rounded shrink-0 overflow-hidden">
                      {link.favicon ? (
                        <img src={link.favicon} alt="" className="w-4 h-4 object-contain" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                    <h3 className="font-medium text-xs text-zinc-200 truncate" title={link.title}>
                      {link.title}
                    </h3>
                  </div>

                  <button
                    onClick={(e) => handleToggleFavorite(link.id, e)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <Star
                      className={`w-3 h-3 ${link.isFavorite ? "text-zinc-100 fill-zinc-100" : ""}`}
                    />
                  </button>
                </div>

                <p className="text-xs text-zinc-400 font-mono truncate">{link.url}</p>

                {link.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {link.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-zinc-500 text-[11px]">
                <span className="font-mono">{formatDate(link.createdAt)}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleCopyUrl(link.url, link.id, e)}
                    className="p-1 hover:text-zinc-300"
                    title="Copy URL"
                  >
                    {copiedId === link.id ? (
                      <Check className="w-3 h-3 text-zinc-100" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:text-zinc-300"
                    title="Open Link"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <LinkModal
        item={activeLink}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setActiveLink(null);
        }}
        onSaveSuccess={fetchLinks}
        onDelete={handleDelete}
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
