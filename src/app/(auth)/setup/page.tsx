"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function SetupPage() {
  const router = useRouter();
  const { error, success } = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        if (data.isSetup) {
          router.replace("/login");
          return;
        }
      } catch (err) {
        console.error("Status check failed:", err);
      } finally {
        setIsCheckingSetup(false);
      }
    }
    checkStatus();
  }, [router]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      error("Username must be at least 3 characters");
      return;
    }
    if (!password || password.length < 6) {
      error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          pinCode: pinCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize vault");
      }

      success("Vault initialized");
      window.location.href = "/";
    } catch (err: any) {
      error(err.message || "Setup failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b]">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
        <div>
          <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center mb-3">
            <span className="text-zinc-950 font-black text-xs">V</span>
          </div>
          <h1 className="text-base font-semibold text-zinc-100">Setup Master Account</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Create your private vault credentials</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Master Password</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Unlock PIN (Optional)</label>
            <input
              type="password"
              maxLength={6}
              placeholder="4-6 digit numeric PIN for phone"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Launch"}
          </button>
        </form>
      </div>
    </div>
  );
}
