import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "个人博客",
    template: "%s | 个人博客",
  },
  description: "分享技术，记录生活",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-[#1A1A1A] font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
