"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Lock, Eye, EyeOff, Share2, CheckCircle, XCircle, ArrowRight, Zap, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateSlug } from '@/lib/slugGenerator';

export default function OnboardingPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [withPw, setWithPw] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [slugError, setSlugError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setSlug(generateSlug()); }, []);

  useEffect(() => {
    if (!slug) return;
    setAvailable(null);
    setSlugError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 48) {
        setAvailable(null);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const res = await fetch(`/api/pages/create?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setAvailable(data.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 450);
  }, [slug]);

  function handleSlugInput(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(cleaned);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || available === false) return;
    setCreating(true);
    try {
      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...(withPw && password ? { password } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSlugError(data.error ?? 'Failed to create space');
        setCreating(false);
        return;
      }
      if (withPw && password) {
        const verifyRes = await fetch(`/api/pages/${slug}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.token) sessionStorage.setItem(`token:${slug}`, verifyData.token);
      }
      router.push(`/s/${slug}`);
    } catch {
      setSlugError('Connection error');
      setCreating(false);
    }
  }

  const isValid = slug.length >= 3 && available === true && (!withPw || password.length >= 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
            <Share2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">FileShare</span>
        </div>
        <span className="text-sm font-medium text-gray-500">Real-time · Secure · Simple</span>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold mb-8 animate-fade-in">
            <Zap size={16} />
            Instant real-time collaboration
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Share files & <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">notes instantly</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            Create a link, share it. Anyone with the URL sees your text and files update in real-time — no account needed.
          </p>
        </div>
        <div className="w-full max-w-lg animate-slide-up">
          <div className="card p-8 max-w-md mx-auto">
            <form onSubmit={handleCreate}>
              <label className="block mb-4">
                <span className="text-sm font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Your space URL</span>
              </label>
              <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4 ring-1 ring-transparent focus-within:ring-blue-500 focus-within:ring-2 transition-all">
                <span className="px-4 py-4 text-sm text-gray-500 font-mono border-r border-gray-200 select-none">/s/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugInput(e.target.value)}
                  placeholder="my-cool-space"
                  className="flex-1 px-4 py-4 text-lg text-gray-900 placeholder-gray-400 outline-none font-mono border-0"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="pr-4">
                  {checking ? (
                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  ) : available === true ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : available === false ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className={`text-sm font-medium ${
                  available === true ? "text-green-600" :
                  available === false ? "text-red-600" :
                  "text-transparent"
                }`}>
                  {available === true ? "✓ Available" : available === false ? "✗ Already taken" : "-"}
                </span>
                <button type="button" onClick={() => setSlug(generateSlug())} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                  Generate new <span aria-hidden>↻</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setWithPw(!withPw)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl border-2 mb-6 transition-all duration-200 hover:shadow-md
                  ${withPw
                    ? "border-blue-300 bg-blue-50 text-blue-800 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }
                `}
              >
                <Lock size={20} className={withPw ? "text-blue-600" : "text-gray-400"} />
                <span className="flex-1 text-left font-medium">Password protect this space</span>
                <div className={`w-10 h-5 rounded-full transition-all duration-300 relative ${withPw ? "bg-blue-600" : "bg-gray-200"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${withPw ? "left-6" : "left-0.5"}`} />
                </div>
              </button>
              {withPw && (
                <div className="relative mb-6">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a password (min. 6 chars)"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 pr-12 text-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none shadow-sm transition-all"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              )}
              {slugError && (
                <p className="text-sm text-red-600 mb-6 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">{slugError}</p>
              )}
              <Button
                type="submit"
                size="lg"
                loading={creating}
                icon={<Rocket size={20} />}
                iconRight={<ArrowRight size={20} />}
                disabled={!isValid}
                className="w-full"
              >
                Create My Space
              </Button>
            </form>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-12 animate-fade-in">
          {[
            { icon: <Zap size={20} className="text-emerald-500" />, label: "Real-time sync" },
            { icon: <Globe size={20} className="text-blue-500" />, label: "Share via URL" },
            { icon: <Shield size={20} className="text-purple-500" />, label: "Password protect" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm text-sm font-medium">
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

