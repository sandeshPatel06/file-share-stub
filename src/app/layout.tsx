import type { Metadata } from "next";
import "./globals.css";
// ThemeProvider removed to fix build - add back after npm i next-themes && restart
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title:       "FileShare — Real-time File & Note Sharing",
  description: "Create a unique URL to share notes and files in real-time. No account needed. Password-protect your space.",
  keywords:    ["file sharing", "real-time", "collaborative", "notes", "live"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
{children}
        <ToastProvider />
      </body>
    </html>
  );
}
