"use client";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id:      string;
  message: string;
  type:    ToastType;
}

let globalShowToast: ((msg: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "info") {
  globalShowToast?.(message, type);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={15} className="text-[#34d399]" />,
  error:   <AlertCircle size={15} className="text-[#f87171]" />,
  info:    <Info        size={15} className="text-[#7c6af7]" />,
};

const borderColors: Record<ToastType, string> = {
  success: "border-[#34d399]/30",
  error:   "border-[#f87171]/30",
  info:    "border-[#7c6af7]/30",
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => { globalShowToast = addToast; return () => { globalShowToast = null; }; }, [addToast]);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-2.5
            glass border ${borderColors[toast.type]}
            rounded-xl px-4 py-3 shadow-[0_8px_32px_#00000060]
            text-sm text-[#e8e8f0] min-w-[240px] max-w-[340px]
            animate-slide-up
          `}
        >
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts((t) => t.filter((x) => x.id !== toast.id))}
            className="text-[#6b6b88] hover:text-[#e8e8f0] transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
