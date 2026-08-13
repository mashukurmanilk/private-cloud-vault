"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { error, success } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        if (!data.isSetup) {
          router.replace("/setup");
          return;
        }
        if (data.authenticated) {
          router.replace("/");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error("Enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      success("Vault unlocked");
      window.location.href = "/";
    } catch (err: any) {
      error(err.message || "Failed to login");
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
        {/* Brand */}
        <div>
          <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center mb-3">
            <span className="text-zinc-950 font-black text-xs">V</span>
          </div>
          <h1 className="text-base font-semibold text-zinc-100">Sign in to Vault</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Enter your master credentials</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
