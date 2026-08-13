"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { useToast } from "./Toast";

interface ShareModalProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ item, isOpen, onClose }: ShareModalProps) {
  const { success, error } = useToast();
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          password: password.trim() || undefined,
          expiresInHours: expiresInHours > 0 ? expiresInHours : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create share link");

      const origin = window.location.origin;
      const fullUrl = `${origin}/s/${data.share.token}`;
      setShareUrl(fullUrl);
      success("Share link created");
    } catch (err: any) {
      error(err.message || "Failed to generate link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      success("Copied");
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="truncate pr-3">
            <h2 className="text-xs font-medium text-zinc-100">Share Link</h2>
            <p className="text-[10px] text-zinc-500 truncate max-w-[240px] mt-0.5">{item.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {!shareUrl ? (
            <form onSubmit={handleCreateShare} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Expiration</label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(parseInt(e.target.value, 10))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value={1}>1 Hour</option>
                  <option value={24}>24 Hours</option>
                  <option value={168}>7 Days</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Optional protection"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full mt-2 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
              >
                {isGenerating ? "Generating..." : "Generate Link"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Shareable URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 select-all font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyShareUrl}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
