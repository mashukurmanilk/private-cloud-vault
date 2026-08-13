"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Loader2,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { success, error } = useToast();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Security Form
  const [pinCode, setPinCode] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/info");
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      }
    } catch (err) {
      console.error("System info error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const handleCopyUrl = () => {
    if (systemInfo?.localUrl) {
      navigator.clipboard.writeText(systemInfo.localUrl);
      setCopiedUrl(true);
      success("URL copied");
      setTimeout(() => setCopiedUrl(false), 1500);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) {
      error("Master password is required");
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinCode: pinCode.trim(), masterPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update PIN");

      success(pinCode.trim() ? "PIN updated" : "PIN removed");
      setPinCode("");
      setMasterPassword("");
    } catch (err: any) {
      error(err.message || "Update failed");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Device pairing, security, and storage</p>
      </div>

      {/* Device Sync */}
      <div className="vault-card p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Device Pairing (Wi-Fi)</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Connect from your phone or tablet on the same Wi-Fi</p>
          </div>
          <button
            onClick={fetchSystemInfo}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* QR Code */}
          <div className="p-2 bg-white rounded-lg shrink-0">
            {systemInfo?.qrCodeDataUrl ? (
              <img
                src={systemInfo.qrCodeDataUrl}
                alt="Vault QR Code"
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-zinc-400">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1 w-full">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Local Network URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={systemInfo?.localUrl || "Detecting..."}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Open your phone camera to scan the code, or visit the link directly in your mobile browser.
            </p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="vault-card p-5 rounded-xl space-y-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Quick Unlock PIN</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Numeric PIN for faster unlocking on phones</p>
        </div>

        <form onSubmit={handleUpdatePin} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">New PIN (4-6 digits)</label>
            <input
              type="password"
              maxLength={6}
              placeholder="Leave blank to disable PIN"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Confirm Master Password</label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPin || !masterPassword}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors"
          >
            {isUpdatingPin ? "Updating..." : "Save PIN"}
          </button>
        </form>
      </div>

      {/* Storage Breakdown */}
      <div className="vault-card p-5 rounded-xl space-y-2 text-xs">
        <h2 className="text-sm font-medium text-zinc-200">Storage Details</h2>
        <div className="text-zinc-400 space-y-1 font-mono text-[11px] pt-1">
          <p>Total Disk Usage: {formatBytes(systemInfo?.storage?.usedBytes || 0)}</p>
          <p>Files on Disk: {systemInfo?.storage?.diskFilesCount || 0}</p>
          <p>Host: {systemInfo?.system?.hostname || "localhost"}</p>
        </div>
      </div>
    </div>
  );
}
