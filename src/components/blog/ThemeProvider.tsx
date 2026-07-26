"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

/* ========== 类型定义 ========== */

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColorPreset {
  id: string;
  label: string;
  light: { l: number; c: number; h: number };
  dark: { l: number; c: number; h: number };
}

/* ========== 预设主题色 ========== */

export const THEME_COLORS: ThemeColorPreset[] = [
  {
    id: "zinc",
    label: " Zinc",
    light: { l: 0.45, c: 0.01, h: 260 },
    dark: { l: 0.65, c: 0.01, h: 260 },
  },
  {
    id: "blue",
    label: "蓝色",
    light: { l: 0.52, c: 0.2, h: 255 },
    dark: { l: 0.7, c: 0.16, h: 255 },
  },
  {
    id: "green",
    label: "绿色",
    light: { l: 0.5, c: 0.16, h: 155 },
    dark: { l: 0.65, c: 0.14, h: 155 },
  },
  {
    id: "purple",
    label: "紫色",
    light: { l: 0.5, c: 0.2, h: 290 },
    dark: { l: 0.68, c: 0.17, h: 290 },
  },
  {
    id: "orange",
    label: "橙色",
    light: { l: 0.56, c: 0.17, h: 50 },
    dark: { l: 0.7, c: 0.15, h: 50 },
  },
  {
    id: "rose",
    label: "玫瑰",
    light: { l: 0.52, c: 0.18, h: 10 },
    dark: { l: 0.68, c: 0.15, h: 10 },
  },
];

/* ========== Context ========== */

interface ThemeContextValue {
  mode: ThemeMode;
  colorId: string;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  setColor: (colorId: string) => void;
  colorPresets: typeof THEME_COLORS;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ========== 工具函数 ========== */

const STORAGE_KEY_MODE = "blog-theme-mode";
const STORAGE_KEY_COLOR = "blog-theme-color";

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY_MODE);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function getStoredColor(): string {
  if (typeof window === "undefined") return "zinc";
  return localStorage.getItem(STORAGE_KEY_COLOR) || "zinc";
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function getColorPreset(id: string): ThemeColorPreset {
  return THEME_COLORS.find((c) => c.id === id) || THEME_COLORS[0];
}

function applyTheme(mode: ThemeMode, colorId: string) {
  const resolved = resolveMode(mode);
  const preset = getColorPreset(colorId);
  const colorValues = resolved === "dark" ? preset.dark : preset.light;
  const root = document.documentElement;

  // 博客主题色变量（仅 --theme，不碰 shadcn 的 --primary）
  root.style.setProperty(
    "--theme",
    `oklch(${colorValues.l} ${colorValues.c} ${colorValues.h})`,
  );
  root.style.setProperty(
    "--theme-foreground",
    resolved === "dark" ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)",
  );
}

/* ========== Provider ========== */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [colorId, setColorIdState] = useState<string>("zinc");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // 初始化：从 localStorage 读取并应用
  useEffect(() => {
    const storedMode = getStoredMode();
    const storedColor = getStoredColor();
    setModeState(storedMode);
    setColorIdState(storedColor);
    setResolvedMode(resolveMode(storedMode));
    applyTheme(storedMode, storedColor);
    setMounted(true);
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setModeState((prev) => {
        if (prev === "system") {
          const next = resolveMode("system");
          setResolvedMode(next);
          applyTheme("system", colorId);
        }
        return prev;
      });
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [colorId]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    setResolvedMode(resolveMode(newMode));
    applyTheme(newMode, colorId);
  }, [colorId]);

  const setColor = useCallback((newColorId: string) => {
    setColorIdState(newColorId);
    localStorage.setItem(STORAGE_KEY_COLOR, newColorId);
    applyTheme(mode, newColorId);
  }, [mode]);

  // 避免 SSR 水合不匹配：首次渲染不应用任何主题类
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          mode: "system",
          colorId: "zinc",
          resolvedMode: "light",
          setMode,
          setColor,
          colorPresets: THEME_COLORS,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ mode, colorId, resolvedMode, setMode, setColor, colorPresets: THEME_COLORS }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* ========== Hook ========== */

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
