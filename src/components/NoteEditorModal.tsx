"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Trash2,
  Share2,
  Pin,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "./Toast";
import { formatDate } from "@/lib/utils";

interface NoteEditorModalProps {
  note: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDelete: (id: string) => void;
  onShare: (item: any) => void;
}

export function NoteEditorModal({
  note,
  isOpen,
  onClose,
  onSaveSuccess,
  onDelete,
  onShare,
}: NoteEditorModalProps) {
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setIsPinned(Boolean(note.isPinned));
    } else if (!note && isOpen) {
      setTitle("");
      setContent("");
      setIsPinned(false);
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      if (note && note.id) {
        const res = await fetch(`/api/items/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content,
            isPinned,
          }),
        });

        if (!res.ok) throw new Error("Failed to update note");
        success("Saved");
      } else {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "NOTE",
            title: title.trim(),
            content,
            isPinned,
          }),
        });

        if (!res.ok) throw new Error("Failed to create note");
        success("Saved");
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none w-full max-w-sm"
          />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded transition-colors ${
                isPinned ? "text-zinc-100 bg-zinc-800" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Pin"
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-zinc-100" : ""}`} />
            </button>

            <button
              onClick={copyContent}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {note && (
              <button
                onClick={() => onShare(note)}
                className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            {note && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${note.title}"?`)) {
                    onDelete(note.id);
                    onClose();
                  }
                }}
                className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors ml-1"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 bg-zinc-950/40 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note, code, or markdown here..."
            className="w-full flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 font-mono text-xs leading-relaxed focus:outline-none resize-none"
          />
        </div>

        {/* Footer */}
        {note?.updatedAt && (
          <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/60 text-[10px] text-zinc-500 font-mono text-right">
            Last saved {formatDate(note.updatedAt)}
          </div>
        )}
      </div>
    </div>
  );
}
