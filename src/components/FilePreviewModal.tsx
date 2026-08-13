"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Share2,
  Trash2,
  Copy,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";
import { useToast } from "./Toast";

interface FilePreviewModalProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (item: any) => void;
  onDelete: (id: string) => void;
}

export function FilePreviewModal({
  item,
  isOpen,
  onClose,
  onShare,
  onDelete,
}: FilePreviewModalProps) {
  const { success } = useToast();
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item || !isOpen) {
      setTextContent(null);
      return;
    }

    const cat = getFileCategory(item.mimeType, item.originalName);
    if (cat === "code" || cat === "doc") {
      setLoadingText(true);
      fetch(`/api/files/stream/${item.id}`)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt);
          setLoadingText(false);
        })
        .catch(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const category = getFileCategory(item.mimeType, item.originalName);
  const streamUrl = `/api/files/stream/${item.id}`;
  const downloadUrl = `/api/files/download/${item.id}`;

  const copyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      success("Copied");
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[250px] bg-zinc-950/60">
          {category === "image" && (
            <img
              src={streamUrl}
              alt={item.title}
              className="max-h-[60vh] max-w-full object-contain rounded border border-zinc-800"
            />
          )}

          {category === "audio" && (
            <div className="w-full max-w-sm p-4 text-center space-y-3">
              <audio controls className="w-full" src={streamUrl} />
            </div>
          )}

          {category === "pdf" && (
            <iframe src={streamUrl} className="w-full h-[65vh] rounded bg-white" title={item.title} />
          )}

          {(category === "code" || category === "doc") && (
            <div className="w-full h-full max-h-[60vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px]">
                <span className="text-zinc-400 font-mono">{item.originalName}</span>
                <button
                  onClick={copyText}
                  className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-zinc-100" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="p-3 overflow-auto flex-1 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {loadingText ? (
                  <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  textContent || "No text preview."
                )}
              </div>
            </div>
          )}

          {category !== "image" && category !== "audio" && category !== "pdf" && category !== "code" && category !== "doc" && (
            <div className="p-6 text-center space-y-2">
              <FileText className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-xs text-zinc-400">Preview not supported for this format.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
