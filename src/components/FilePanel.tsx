"use client";
import { useCallback, useRef, useState } from "react";
import { UploadCloud, FolderOpen } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { FileCard } from "@/components/FileCard";
import { showToast } from "@/components/ui/Toast";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validators";

interface FilePanelProps {
  slug:  string;
  token: string | null;
}

export function FilePanel({ slug, token }: FilePanelProps) {
  const { files, loading } = useFileList(slug);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState<string[]>([]); // filenames uploading
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      showToast(`File type not allowed: ${file.type || "unknown"}`, "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File too large (max 50 MB): ${file.name}`, "error");
      return;
    }

    setUploading((u) => [...u, file.name]);

    try {
      // Step 1: get signed upload URL
      const metaRes = await fetch(`/api/pages/${slug}/files/upload`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filename: file.name, mimetype: file.type, size: file.size }),
      });

      if (!metaRes.ok) {
        const err = await metaRes.json();
        showToast(err.error ?? "Upload failed", "error");
        return;
      }

      const { signedUrl } = await metaRes.json();

      // Step 2: upload directly to Firebase Storage via signed URL
      const uploadRes = await fetch(signedUrl, {
        method:  "PUT",
        headers: { "Content-Type": file.type },
        body:    file,
      });

      if (!uploadRes.ok) {
        showToast(`Upload failed for ${file.name}`, "error");
        return;
      }

      showToast(`${file.name} uploaded`, "success");
      // Firestore metadata was already written by API — onSnapshot fires automatically
    } catch {
      showToast("Upload error", "error");
    } finally {
      setUploading((u) => u.filter((n) => n !== file.name));
    }
  }, [slug, token]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave()                  { setDragging(false); }
  function onDrop(e: React.DragEvent)     { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a3d] shrink-0">
        <div className="flex items-center gap-2 text-[#6b6b88]">
          <FolderOpen size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Files</span>
          {files.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#7c6af7]/20 text-[#7c6af7] text-[10px] font-semibold">
              {files.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3
            rounded-xl border-2 border-dashed p-8 cursor-pointer
            transition-all duration-200
            ${dragging
              ? "border-[#7c6af7] bg-[#7c6af7]/10 scale-[1.01]"
              : "border-[#2a2a3d] hover:border-[#3a3a50] hover:bg-[#ffffff04]"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            transition-all duration-200
            ${dragging ? "bg-[#7c6af7]/20" : "bg-[#1a1a24]"}
          `}>
            <UploadCloud size={22} className={dragging ? "text-[#7c6af7]" : "text-[#6b6b88]"} />
          </div>
          <div className="text-center">
            <p className={`text-sm font-medium transition-colors ${dragging ? "text-[#7c6af7]" : "text-[#e8e8f0]"}`}>
              {dragging ? "Drop to upload" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-[#6b6b88] mt-0.5">or click to browse · max 50 MB</p>
          </div>
        </div>

        {/* Uploading indicators */}
        {uploading.map((name) => (
          <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a24] border border-[#7c6af7]/30">
            <div className="w-9 h-9 rounded-lg bg-[#7c6af7]/10 flex items-center justify-center shrink-0">
              <UploadCloud size={16} className="text-[#7c6af7] animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e8e8f0] truncate">{name}</p>
              <div className="h-1 bg-[#2a2a3d] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7c6af7] to-[#4fa3f7] rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        ))}

        {/* File list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : files.length === 0 && uploading.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-[#44445a]">No files yet — upload something!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <FileCard key={f.fileId} file={f} slug={slug} token={token} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
