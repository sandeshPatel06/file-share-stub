"use client";
import { FileItem } from "@/hooks/useFileList";
import { Download, Trash2, File, FileText, Image, FileArchive, FileAudio, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";

interface FileCardProps {
  file:  FileItem;
  slug:  string;
  token: string | null;
}

function FileIcon({ mimetype }: { mimetype: string }) {
  const cls = "shrink-0";
  if (mimetype.startsWith("image/"))  return <Image     size={18} className={`${cls} text-[#4fa3f7]`} />;
  if (mimetype.startsWith("audio/"))  return <FileAudio size={18} className={`${cls} text-[#a78bfa]`} />;
  if (mimetype.startsWith("video/"))  return <FileVideo size={18} className={`${cls} text-[#f87171]`} />;
  if (mimetype === "application/pdf") return <FileText  size={18} className={`${cls} text-[#fb923c]`} />;
  if (mimetype.includes("zip") || mimetype.includes("rar")) return <FileArchive size={18} className={`${cls} text-[#fbbf24]`} />;
  if (mimetype.startsWith("text/") || mimetype === "application/json") return <FileText size={18} className={`${cls} text-[#34d399]`} />;
  return <File size={18} className={`${cls} text-[#6b6b88]`} />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function FileCard({ file, slug, token }: FileCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/pages/${slug}/files/${file.fileId}`, {
        method:  "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { showToast("Failed to delete file", "error"); }
      else showToast("File deleted", "info");
    } catch { showToast("Connection error", "error"); }
    finally { setDeleting(false); setConfirmDel(false); }
  }

  return (
    <div className="
      group flex items-center gap-3 p-3 rounded-xl
      bg-[#1a1a24] border border-[#2a2a3d]
      hover:border-[#3a3a50] hover:bg-[#1e1e2a]
      transition-all duration-200 animate-fade-in
    ">
      {/* File icon */}
      <div className="w-9 h-9 rounded-lg bg-[#13131a] border border-[#2a2a3d] flex items-center justify-center shrink-0">
        <FileIcon mimetype={file.mimetype} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#e8e8f0] truncate">{file.originalName}</p>
        <p className="text-xs text-[#6b6b88] mt-0.5">
          {formatBytes(file.size)}
          {file.uploadedAt && (
            <> · {timeAgo(file.uploadedAt.seconds)}</>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={file.downloadURL} download={file.originalName} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary" icon={<Download size={13} />} title="Download">
            <span className="hidden sm:inline">Download</span>
          </Button>
        </a>

        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 size={13} />}
          loading={deleting}
          onClick={handleDelete}
          title={confirmDel ? "Click again to confirm" : "Delete"}
          className={confirmDel ? "opacity-100 !flex" : ""}
        >
          {confirmDel ? "Confirm?" : ""}
        </Button>
      </div>
    </div>
  );
}
