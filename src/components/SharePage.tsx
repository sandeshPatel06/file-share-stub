"use client";
import { useState } from "react";
import { PasswordGate } from "@/components/PasswordGate";
import { PasswordModal } from "@/components/PasswordModal";
import { SlugBar } from "@/components/SlugBar";
import { TextEditor } from "@/components/TextEditor";
import { FilePanel } from "@/components/FilePanel";
import { Share2 } from "lucide-react";

interface PageData {
  slug:        string;
  isProtected: boolean;
  content:     string;
}

interface SharePageProps {
  pageData: PageData;
}

export function SharePage({ pageData }: SharePageProps) {
  const [token,       setToken]       = useState<string | null>(() => {
    // Restore token from sessionStorage on mount (client only)
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`token:${pageData.slug}`);
  });
  const [isProtected, setIsProtected] = useState(pageData.isProtected);
  const [showPwModal, setShowPwModal] = useState(false);

  const isUnlocked = !isProtected || !!token;

  function handleUnlock(newToken: string) {
    sessionStorage.setItem(`token:${pageData.slug}`, newToken);
    setToken(newToken);
  }

  function handlePasswordChange(newProtected: boolean, newToken?: string) {
    setIsProtected(newProtected);
    if (newToken) {
      sessionStorage.setItem(`token:${pageData.slug}`, newToken);
      setToken(newToken);
    } else if (!newProtected) {
      sessionStorage.removeItem(`token:${pageData.slug}`);
      setToken(null);
    }
  }

  // Show password gate if protected and no token
  if (!isUnlocked) {
    return <PasswordGate slug={pageData.slug} onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0f]">
      {/* Top navigation bar */}
      <header className="flex items-center gap-4 px-4 h-12 border-b border-[#2a2a3d] bg-[#13131a]/90 backdrop-blur-md shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c6af7] to-[#4fa3f7] flex items-center justify-center">
            <Share2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#e8e8f0] hidden sm:block">FileShare</span>
        </div>

        <div className="w-px h-5 bg-[#2a2a3d] shrink-0" />

        {/* Slug bar */}
        <div className="flex-1 min-w-0">
          <SlugBar
            slug={pageData.slug}
            isProtected={isProtected}
            token={token}
            onLockClick={() => setShowPwModal(true)}
          />
        </div>
      </header>

      {/* Split editor/file panel */}
      <main className="flex flex-1 min-h-0">
        {/* Left: Text editor */}
        <div className="flex-1 min-w-0 border-r border-[#2a2a3d] overflow-hidden">
          <TextEditor slug={pageData.slug} token={token} />
        </div>

        {/* Right: File panel */}
        <div className="w-full max-w-xs lg:max-w-sm xl:max-w-md shrink-0 overflow-hidden">
          <FilePanel slug={pageData.slug} token={token} />
        </div>
      </main>

      {/* Modals */}
      <PasswordModal
        open={showPwModal}
        onClose={() => setShowPwModal(false)}
        slug={pageData.slug}
        isProtected={isProtected}
        token={token}
        onSuccess={handlePasswordChange}
      />
    </div>
  );
}
