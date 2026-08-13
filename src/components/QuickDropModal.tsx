"use client";

import React, { useState, useRef, useEffect, DragEvent } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  Loader2,
  File,
  Film,
} from "lucide-react";
import { useToast } from "./Toast";
import { cn, formatBytes } from "@/lib/utils";

interface QuickDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "files" | "link" | "note";
  onSuccess?: () => void;
}

export function QuickDropModal({
  isOpen,
  onClose,
  initialTab = "files",
  onSuccess,
}: QuickDropModalProps) {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<"files" | "link" | "note">(initialTab);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Files Tab State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  // Link Tab State
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkFavicon, setLinkFavicon] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  // Note Tab State
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        setActiveTab("files");
        setSelectedFiles((prev) => [...prev, ...files]);
        success(`Pasted ${files.length} file(s)`);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, success]);

  if (!isOpen) return null;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      error("Select at least one file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      if (category) formData.append("category", category);
      if (tags) formData.append("tags", tags);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      success(`Uploaded ${data.count} file(s)`);
      setSelectedFiles([]);
      setCategory("");
      setTags("");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const scrapeUrlMetadata = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsScraping(true);
    try {
      const res = await fetch("/api/links/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title && !linkTitle) setLinkTitle(data.title);
        if (data.description && !linkDescription) setLinkDescription(data.description);
        if (data.favicon) setLinkFavicon(data.favicon);
        if (data.url) setLinkUrl(data.url);
      }
    } catch {
      // ignore
    } finally {
      setIsScraping(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "LINK",
          title: linkTitle.trim() || linkUrl.trim(),
          url: linkUrl.trim(),
          description: linkDescription.trim() || null,
          favicon: linkFavicon || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save link");

      success("Link saved");
      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save link");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE",
          title: noteTitle.trim(),
          content: noteContent,
          isPinned,
        }),
      });

      if (!res.ok) throw new Error("Failed to save note");

      success("Note saved");
      setNoteTitle("");
      setNoteContent("");
      setIsPinned(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save note");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 pt-3 bg-zinc-950/40">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("files")}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "files"
                  ? "border-zinc-100 text-zinc-100 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab("link")}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "link"
                  ? "border-zinc-100 text-zinc-100 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              Link
            </button>
            <button
              onClick={() => setActiveTab("note")}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "note"
                  ? "border-zinc-100 text-zinc-100 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              Note
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 mb-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {activeTab === "files" && (
            <form onSubmit={handleUploadFiles} className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-zinc-400 bg-zinc-800/40"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-xs text-zinc-300 font-medium">Click to select or drop files here</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Videos, images, documents, audio</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md bg-zinc-950/60 border border-zinc-800 text-xs"
                    >
                      <span className="text-zinc-300 truncate max-w-[280px]">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono text-[10px]">{formatBytes(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || selectedFiles.length === 0}
                className="w-full py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
              >
                {isUploading ? "Uploading..." : `Upload (${selectedFiles.length})`}
              </button>
            </form>
          )}

          {activeTab === "link" && (
            <form onSubmit={handleCreateLink} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onBlur={() => {
                    if (linkUrl && !linkTitle) scrapeUrlMetadata(linkUrl);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Link title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Description or notes"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !linkUrl}
                className="w-full mt-2 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
              >
                {isUploading ? "Saving..." : "Save Link"}
              </button>
            </form>
          )}

          {activeTab === "note" && (
            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Content</label>
                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`text-[11px] ${isPinned ? "text-zinc-100 font-semibold" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {isPinned ? "Pinned" : "Pin to top"}
                  </button>
                </div>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your note or code snippet..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !noteTitle.trim()}
                className="w-full mt-2 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
              >
                {isUploading ? "Saving..." : "Save Note"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
