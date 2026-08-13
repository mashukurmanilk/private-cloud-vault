"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Star,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { ShareModal } from "@/components/ShareModal";
import { useToast } from "@/components/Toast";

export default function NotesPage() {
  const { success, error } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [shareItem, setShareItem] = useState<any | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/items?type=NOTE");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.items || []);
      }
    } catch (err) {
      console.error("Fetch notes error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    const handleRefresh = () => fetchNotes();
    window.addEventListener("vault:refresh", handleRefresh);
    return () => window.removeEventListener("vault:refresh", handleRefresh);
  }, [fetchNotes]);

  const handleCopyNote = (content: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    success("Copied");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleTogglePin = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/items/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, isPinned: !n.isPinned } : n))
        );
        success(!note.isPinned ? "Pinned" : "Unpinned");
      }
    } catch {
      error("Failed to pin");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((it) => it.id !== id));
        success("Deleted");
      }
    } catch {
      error("Failed to delete");
    }
  };

  const allTags = Array.from(
    new Set(
      notes
        .flatMap((n) => (n.tags ? n.tags.split(",").map((t: string) => t.trim()) : []))
        .filter(Boolean)
    )
  );

  const filteredNotes = notes.filter((item) => {
    if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
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
          <h1 className="text-lg font-semibold text-zinc-100">Notes</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{filteredNotes.length} notes</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setActiveNote(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
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

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-500">No notes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                setActiveNote(note);
                setIsEditorOpen(true);
              }}
              className={`vault-card-interactive group rounded-xl p-4 cursor-pointer flex flex-col justify-between space-y-3 ${
                note.isPinned ? "border-zinc-700 bg-zinc-900/60" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-xs text-zinc-200 truncate">{note.title}</h3>
                  <button
                    onClick={(e) => handleTogglePin(note, e)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300"
                  >
                    <Pin className={`w-3 h-3 ${note.isPinned ? "text-zinc-200 fill-zinc-200" : ""}`} />
                  </button>
                </div>

                <p className="font-mono text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {note.content || "Empty note"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                <span>{formatDate(note.updatedAt)}</span>
                <button
                  onClick={(e) => handleCopyNote(note.content, note.id, e)}
                  className="p-1 hover:text-zinc-300"
                  title="Copy"
                >
                  {copiedId === note.id ? (
                    <Check className="w-3 h-3 text-zinc-100" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NoteEditorModal
        note={activeNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setActiveNote(null);
        }}
        onSaveSuccess={fetchNotes}
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
