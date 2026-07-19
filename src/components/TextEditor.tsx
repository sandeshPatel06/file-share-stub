"use client";
import { useCallback, useRef, useEffect } from "react";
import { CheckCircle, Loader, FileEdit } from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";

interface TextEditorProps {
  slug:  string;
  token: string | null;
}

type SaveStatus = "idle" | "saving" | "saved";

export function TextEditor({ slug, token }: TextEditorProps) {
  const { content, setContent, loading, isRemote } = usePageContent(slug);
  const saveStatus  = useRef<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusEl    = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);

  function setStatus(s: SaveStatus) {
    saveStatus.current = s;
    if (!statusEl.current) return;
    statusEl.current.dataset.status = s;
  }

  const saveContent = useCallback(async (text: string) => {
    setStatus("saving");
    try {
      await fetch(`/api/pages/${slug}/content`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text }),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }, [slug, token]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    isRemote.current = false;
    setContent(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveContent(val), 600);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a3d] shrink-0">
        <div className="flex items-center gap-2 text-[#6b6b88]">
          <FileEdit size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Note</span>
        </div>

        {/* Save status */}
        <div ref={statusEl} data-status="idle" className="group">
          <div className="[div[data-status='saving']_&]:flex hidden items-center gap-1.5 text-xs text-[#6b6b88]">
            <Loader size={12} className="animate-spin-slow" />
            <span>Saving…</span>
          </div>
          <div className="[div[data-status='saved']_&]:flex hidden items-center gap-1.5 text-xs text-[#34d399]">
            <CheckCircle size={12} />
            <span>Saved</span>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[80, 65, 90, 55, 70].map((w, i) => (
              <div key={i} className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content ?? ""}
            onChange={handleChange}
            placeholder="Start typing… changes sync in real-time across all open tabs."
            className={`
              w-full min-h-full bg-transparent
              text-[#e8e8f0] placeholder-[#44445a]
              font-mono text-sm leading-relaxed
              resize-none outline-none border-none
              caret-[#7c6af7] selection:bg-[#7c6af730]
            `}
            style={{ minHeight: "calc(100vh - 220px)" }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
