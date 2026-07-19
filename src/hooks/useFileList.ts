"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export interface FileItem {
  fileId:       string;
  originalName: string;
  storagePath:  string;
  downloadURL:  string;
  mimetype:     string;
  size:         number;
  uploadedAt:   { seconds: number } | null;
}

export function useFileList(slug: string) {
  const [files, setFiles]   = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "pages", slug, "files"),
      orderBy("uploadedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setFiles(
          snap.docs.map((d) => ({ fileId: d.id, ...d.data() } as FileItem))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [slug]);

  return { files, loading };
}
