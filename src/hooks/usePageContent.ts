"use client";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export function usePageContent(slug: string) {
  const [content, setContent]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const isRemote = useRef(false); // flag to avoid echo-updating local state

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "pages", slug),
      (snap) => {
        if (snap.exists()) {
          const incoming = snap.data().content ?? "";
          isRemote.current = true;
          setContent(incoming);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [slug]);

  return { content, setContent, loading, isRemote };
}
