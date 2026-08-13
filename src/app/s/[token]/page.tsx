"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Lock,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { formatBytes, formatDate, getFileCategory } from "@/lib/utils";

export default function SharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [shareData, setShareData] = useState<any | null>(null);
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password state
  const [password, setPassword] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Link not found or expired.");
        return res.json();
      })
      .then((data) => {
        setShareData(data.share);
        if (!data.share.requiresPassword) {
          setItem(data.share.item);
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load share link");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setVerifyingPassword(true);

    try {
      const res = await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect password");

      setItem(data.item);
    } catch (err: any) {
      setPasswordError(err.message || "Invalid password");
    } finally {
      setVerifyingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b]">
        <div className="max-w-sm w-full p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
          <h1 className="text-sm font-medium text-zinc-100">Link Unavailable</h1>
          <p className="text-xs text-zinc-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (shareData?.requiresPassword && !item?.content && !item?.url && !item?.originalName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b]">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="text-center space-y-1">
            <Lock className="w-5 h-5 text-zinc-400 mx-auto" />
            <h1 className="text-sm font-medium text-zinc-100">Password Protected</h1>
            <p className="text-xs text-zinc-500">Enter password to access this item</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-center text-zinc-200 focus:outline-none focus:border-zinc-600"
            />

            {passwordError && (
              <p className="text-xs text-rose-400 text-center">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={verifyingPassword || !password}
              className="w-full py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
            >
              {verifyingPassword ? "Checking..." : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const category = getFileCategory(item?.mimeType, item?.originalName);
  const streamUrl = `/api/files/stream/${item?.id}?share=${token}`;
  const downloadUrl = `/api/files/download/${item?.id}?share=${token}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="truncate pr-3">
            <h1 className="text-xs font-medium text-zinc-100 truncate">{item.title}</h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Shared via Vault · {formatDate(item.createdAt)}
            </p>
          </div>

          {(item.type === "FILE" || item.type === "VIDEO") && (
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-1 px-3 py-1 rounded bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-zinc-200 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </a>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[250px] bg-zinc-950/60">
          {item.type === "VIDEO" && (
            <video
              src={streamUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[60vh] object-contain rounded"
            />
          )}

          {item.type === "FILE" && category === "image" && (
            <img
              src={streamUrl}
              alt={item.title}
              className="max-h-[60vh] max-w-full object-contain rounded border border-zinc-800"
            />
          )}

          {item.type === "FILE" && category === "audio" && (
            <audio controls className="w-full max-w-sm" src={streamUrl} />
          )}

          {item.type === "FILE" && category === "pdf" && (
            <iframe src={streamUrl} className="w-full h-[65vh] rounded bg-white" title={item.title} />
          )}

          {item.type === "NOTE" && (
            <div className="w-full p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-[11px] font-mono text-zinc-500">Note</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.content || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-zinc-100" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
            </div>
          )}

          {item.type === "LINK" && (
            <div className="w-full max-w-md p-4 text-center space-y-3">
              <h2 className="text-sm font-medium text-zinc-100">{item.title}</h2>
              <p className="text-xs text-zinc-400 font-mono break-all">{item.url}</p>
              {item.description && (
                <p className="text-xs text-zinc-500">{item.description}</p>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-zinc-200 transition-colors"
              >
                <span>Visit Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
