"use client";
import { useState, useRef } from "react";
import { Lock, Eye, EyeOff, Unlock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PasswordGateProps {
  slug: string;
  onUnlock: (token: string) => void;
}

export function PasswordGate({ slug, onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/pages/${slug}/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid password");
        setShake(true);
        setPassword("");
        setTimeout(() => setShake(false), 500);
        inputRef.current?.focus();
        return;
      }

      onUnlock(data.token);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7c6af7]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#4fa3f7]/5 blur-[100px]" />
      </div>

      <div
        className={`
          relative w-full max-w-sm glass rounded-2xl p-8
          border border-[#2a2a3d] shadow-[0_32px_80px_#00000090]
          animate-slide-up ${shake ? "animate-shake" : ""}
        `}
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#7c6af7]/10 border border-[#7c6af7]/20 flex items-center justify-center">
            <Lock size={24} className="text-[#7c6af7]" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-center text-[#e8e8f0] mb-1">
          Protected Space
        </h1>
        <p className="text-sm text-center text-[#6b6b88] mb-6">
          Enter the password to access this page
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              autoFocus
              className={`
                w-full bg-[#0a0a0f] border rounded-xl px-4 py-3 pr-11
                text-[#e8e8f0] placeholder-[#44445a] text-sm
                outline-none transition-all duration-200
                ${error
                  ? "border-[#f87171] focus:border-[#f87171] focus:shadow-[0_0_0_3px_#f8717120]"
                  : "border-[#2a2a3d] focus:border-[#7c6af7] focus:shadow-[0_0_0_3px_#7c6af720]"
                }
              `}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b88] hover:text-[#e8e8f0] transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-[#f87171] text-xs animate-fade-in">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            icon={<Unlock size={15} />}
            className="w-full"
            size="lg"
          >
            Unlock
          </Button>
        </form>

        <p className="text-xs text-center text-[#44445a] mt-4">
          /{slug}
        </p>
      </div>
    </div>
  );
}
