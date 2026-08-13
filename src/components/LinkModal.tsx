"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Trash2,
  Save,
} from "lucide-react";
import { useToast } from "./Toast";
import { formatDate } from "@/lib/utils";

interface LinkModalProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDelete: (id: string) => void;
  onShare: (item: any) => void;
}

export function LinkModal({
  item,
  isOpen,
  onClose,
  onSaveSuccess,
  onDelete,
  onShare,
}: LinkModalProps) {
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title || "");
      setUrl(item.url || "");
      setDescription(item.description || "");
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      success("Saved");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="truncate pr-3">
            <h2 className="text-xs font-medium text-zinc-100 truncate">Bookmark</h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatDate(item.createdAt)}</p>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Visit"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleCopyUrl}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => onShare(item)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Delete bookmark "${item.title}"?`)) {
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
