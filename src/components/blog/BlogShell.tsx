"use client";

import { type ReactNode } from "react";
import { useTheme } from "@/components/blog/ThemeProvider";

/**
 * 博客外壳 — 将 .dark 作用域限制在博客内容区域内
 * 管理后台不受 .dark 影响，始终保持浅色模式
 */
export function BlogShell({ children }: { children: ReactNode }) {
  const { resolvedMode } = useTheme();

  return (
    <div
      className={
        resolvedMode === "dark"
          ? "dark flex-1 flex flex-col bg-background text-foreground"
          : "flex-1 flex flex-col bg-background text-foreground"
      }
    >
      {children}
    </div>
  );
}
