"use client";

import React, { useState } from "react";
import { Lock, Unlock, Loader2 } from "lucide-react";
import { useToast } from "./Toast";

interface LockOverlayProps {
  isLocked: boolean;
  onUnlock: () => void;
  hasPin?: boolean;
}

export function LockOverlay({ isLocked, onUnlock, hasPin = false }: LockOverlayProps) {
  const { success, error } = useToast();
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [usePasswordMode, setUsePasswordMode] = useState(!hasPin);
  const [loading, setLoading] = useState(false);

  if (!isLocked) return null;

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length >= 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const verifyPin = async (candidatePin: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinCode: candidatePin }),
      });

      if (res.ok) {
        success("Unlocked");
        setPin("");
        onUnlock();
      } else {
        if (candidatePin.length >= 6) {
          error("Incorrect PIN");
          setPin("");
        }
      }
    } catch {
      error("Verification failed");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = "/login";
        return;
      }

      onUnlock();
      success("Unlocked");
      setPassword("");
    } catch {
      error("Failed to unlock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
          <Lock className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Vault Locked</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Enter PIN or password to unlock</p>
        </div>

        {/* PIN Pad Mode */}
        {!usePasswordMode && (
          <div className="w-full space-y-6">
            <div className="flex justify-center gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    pin.length > i ? "bg-zinc-100 scale-110" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(num.toString())}
                  disabled={loading}
                  className="w-14 h-14 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-200 active:scale-95 transition-all flex items-center justify-center mx-auto"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUsePasswordMode(true)}
                className="w-14 h-14 text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center mx-auto"
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => handlePinInput("0")}
                disabled={loading}
                className="w-14 h-14 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-200 active:scale-95 transition-all flex items-center justify-center mx-auto"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinBackspace}
                className="w-14 h-14 text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center mx-auto"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* Master Password Mode */}
        {usePasswordMode && (
          <form onSubmit={handlePasswordUnlock} className="w-full space-y-3 max-w-[240px]">
            <input
              type="password"
              placeholder="Master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-center text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Unlock</span>
            </button>

            {hasPin && (
              <button
                type="button"
                onClick={() => setUsePasswordMode(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Use PIN instead
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
