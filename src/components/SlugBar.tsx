"use client";
import { useState, useRef } from "react";
import { Pencil, Link2, Lock, Unlock, Check, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { slugSchema } from "@/lib/validators";
import { useRouter } from "next/navigation";

interface SlugBarProps {
  slug:        string;
  isProtected: boolean;
  token:       string | null;
  onLockClick: () => void;
}

export function SlugBar({ slug, isProtected, token, onLockClick }: SlugBarProps) {
  const [editing,     setEditing]     = useState(false);
  const [newSlug,     setNewSlug]     = useState(slug);
  const [available,   setAvailable]   = useState<boolean | null>(null);
  const [checking,    setChecking]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [slugError,   setSlugError]   = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  function startEditing() { setNewSlug(slug); setAvailable(null); setSlugError(""); setEditing(true); }
  function cancelEditing() { setEditing(false); setSlugError(""); }

  function handleSlugChange(val: string) {
    setNewSlug(val);
    setAvailable(null);
    setSlugError("");

    const parsed = slugSchema.safeParse(val);
    if (!parsed.success) {
      setSlugError(parsed.error.issues[0]?.message ?? "Invalid slug");
      return;
    }
    if (val === slug) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pages/create?slug=${encodeURIComponent(val)}`);
        const data = await res.json();
        setAvailable(data.available);
      } catch { setAvailable(null); }
      finally { setChecking(false); }
    }, 400);
  }

  async function handleSave() {
    if (!available || slugError) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${slug}/rename`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newSlug }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Failed to rename", "error"); return; }
      showToast("Slug updated!", "success");
      router.push(`/s/${data.newSlug}`);
    } catch { showToast("Connection error", "error"); }
    finally { setSaving(false); setEditing(false); }
  }

  async function copyLink() {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`;
    await navigator.clipboard.writeText(url);
    showToast("Link copied!", "success");
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* App brand */}
      <span className="text-[#6b6b88] text-sm font-medium select-none shrink-0">/s/</span>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <input
              autoFocus
              value={newSlug}
              onChange={(e) => handleSlugChange(e.target.value.toLowerCase())}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") cancelEditing(); }}
              className={`
                w-full bg-[#0a0a0f] border rounded-lg px-3 py-1.5 pr-8 text-sm text-[#e8e8f0]
                outline-none transition-all
                ${slugError      ? "border-[#f87171] focus:shadow-[0_0_0_3px_#f8717120]"
                  : available === false ? "border-[#f87171] focus:shadow-[0_0_0_3px_#f8717120]"
                  : available === true  ? "border-[#34d399] focus:shadow-[0_0_0_3px_#34d39920]"
                  : "border-[#2a2a3d] focus:border-[#7c6af7] focus:shadow-[0_0_0_3px_#7c6af720]"
                }
              `}
            />
            {/* Availability indicator */}
            {!slugError && newSlug !== slug && (
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium
                ${checking ? "text-[#6b6b88]" : available ? "text-[#34d399]" : available === false ? "text-[#f87171]" : ""}
              `}>
                {checking ? "…" : available ? "✓" : available === false ? "✗" : ""}
              </span>
            )}
          </div>
          {slugError && <span className="text-[10px] text-[#f87171] shrink-0 max-w-[120px] truncate">{slugError}</span>}
          <Button size="sm" variant="secondary" icon={<Check size={12} />}
            disabled={!!slugError || !available || newSlug === slug || checking}
            loading={saving} onClick={handleSave} />
          <Button size="sm" variant="ghost" icon={<X size={12} />} onClick={cancelEditing} />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-[#e8e8f0] truncate max-w-[180px]">{slug}</span>
          <button onClick={startEditing}
            className="text-[#6b6b88] hover:text-[#7c6af7] transition-colors p-0.5"
            title="Edit slug">
            <Pencil size={13} />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 ml-1 shrink-0">
        <Button size="sm" variant="ghost" icon={<Copy size={13} />} onClick={copyLink} title="Copy link">
          <span className="hidden sm:inline">Copy Link</span>
        </Button>

        <button
          onClick={onLockClick}
          title={isProtected ? "Password protected" : "Add password"}
          className={`
            flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200
            ${isProtected
              ? "text-[#7c6af7] bg-[#7c6af7]/10 hover:bg-[#7c6af7]/20 border border-[#7c6af7]/30"
              : "text-[#6b6b88] hover:text-[#e8e8f0] hover:bg-[#ffffff0a]"
            }
          `}
        >
          {isProtected ? <Lock size={13} /> : <Unlock size={13} />}
          <span className="hidden sm:inline">{isProtected ? "Locked" : "Lock"}</span>
        </button>
      </div>
    </div>
  );
}
