import Link from "next/link";
import { Share2, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7c6af7]/5 blur-[120px]" />
      </div>

      <div className="relative text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c6af7] to-[#4fa3f7] flex items-center justify-center shadow-[0_0_40px_#7c6af740]">
            <Share2 size={28} className="text-white" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-[#e8e8f0] mb-2">404</h1>
        <p className="text-lg text-[#6b6b88] mb-2">This space doesn&apos;t exist</p>
        <p className="text-sm text-[#44445a] mb-8">The slug may have been renamed or never created.</p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#7c6af7] hover:bg-[#6a58e5] text-white text-sm font-medium
            transition-all duration-200 shadow-[0_0_20px_#7c6af730]
            hover:shadow-[0_0_28px_#7c6af750] active:scale-[0.97]"
        >
          <ArrowLeft size={15} />
          Create your own space
        </Link>
      </div>
    </div>
  );
}
