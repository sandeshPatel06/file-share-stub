"use client";
import { useState } from "react";
import { KeyRound, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface PasswordModalProps {
  open:        boolean;
  onClose:     () => void;
  slug:        string;
  isProtected: boolean;
  token:       string | null;
  onSuccess:   (newProtected: boolean, newToken?: string) => void;
}

export function PasswordModal({ open, onClose, slug, isProtected, token, onSuccess }: PasswordModalProps) {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  function reset() { setPassword(""); setConfirm(""); setError(""); setShowPw(false); }

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${slug}/password`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }

      // Get new token for the new password
      const verifyRes = await fetch(`/api/pages/${slug}/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      const verifyData = await verifyRes.json();

      showToast("Password set successfully", "success");
      onSuccess(true, verifyData.token);
      reset(); onClose();
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${slug}/password`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: null }),
      });
      if (!res.ok) { setError("Failed to remove password"); return; }
      showToast("Password removed", "info");
      onSuccess(false);
      reset(); onClose();
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={isProtected ? "Change Password" : "Set Password"}>
      {isProtected && (
        <div className="mb-5 p-3 rounded-xl bg-[#7c6af7]/10 border border-[#7c6af7]/20 flex items-center gap-2.5">
          <Lock size={14} className="text-[#7c6af7] shrink-0" />
          <span className="text-xs text-[#b0aedf]">This page is currently password-protected.</span>
        </div>
      )}

      <form onSubmit={handleSet} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-[#6b6b88] uppercase tracking-wider">New Password</span>
          <div className="relative mt-1.5">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full bg-[#0a0a0f] border border-[#2a2a3d] focus:border-[#7c6af7] focus:shadow-[0_0_0_3px_#7c6af720] rounded-xl px-3 py-2.5 pr-10 text-sm text-[#e8e8f0] placeholder-[#44445a] outline-none transition-all"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b88] hover:text-[#e8e8f0] transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[#6b6b88] uppercase tracking-wider">Confirm Password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="mt-1.5 w-full bg-[#0a0a0f] border border-[#2a2a3d] focus:border-[#7c6af7] focus:shadow-[0_0_0_3px_#7c6af720] rounded-xl px-3 py-2.5 text-sm text-[#e8e8f0] placeholder-[#44445a] outline-none transition-all"
          />
        </label>

        {error && <p className="text-xs text-[#f87171] flex items-center gap-1.5">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="submit" icon={<KeyRound size={14} />} loading={loading} className="flex-1">
            Set Password
          </Button>
          {isProtected && (
            <Button
              type="button"
              variant="danger"
              icon={<Unlock size={14} />}
              loading={loading}
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
