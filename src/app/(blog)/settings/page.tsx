"use client";

import { Header } from "@/components/blog/Header";
import { useTheme, THEME_COLORS, type ThemeMode } from "@/components/blog/ThemeProvider";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

export default function SettingsPage() {
  const { mode, colorId, resolvedMode, setMode, setColor, colorPresets } = useTheme();

  return (
    <>
      <Header backUrl="/" backLabel="首页" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-xl font-medium text-foreground mb-10">设置</h1>

        {/* ===== 外观模式 ===== */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-foreground mb-4">外观模式</h2>
          <div className="grid grid-cols-3 gap-3">
            {MODE_OPTIONS.map((opt) => {
              const isActive = mode === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    isActive
                      ? "border-[var(--theme)] bg-[var(--theme)]/5"
                      : "border-border hover:border-border/80 hover:bg-muted/50",
                  )}
                  style={
                    isActive
                      ? { borderColor: "var(--theme)", backgroundColor: "oklch(from var(--theme) l c h / 5%)" }
                      : undefined
                  }
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-[var(--theme)]" : "text-muted-foreground",
                    )}
                    style={isActive ? { color: "var(--theme)" } : undefined}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      isActive ? "font-medium text-[var(--theme)]" : "text-muted-foreground",
                    )}
                    style={isActive ? { color: "var(--theme)" } : undefined}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== 主题色 ===== */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">主题色</h2>
          <div className="flex flex-wrap gap-4">
            {colorPresets.map((preset) => {
              const isActive = colorId === preset.id;
              const colorValues = resolvedMode === "dark" ? preset.dark : preset.light;
              const bgColor = `oklch(${colorValues.l} ${colorValues.c} ${colorValues.h})`;

              return (
                <button
                  key={preset.id}
                  onClick={() => setColor(preset.id)}
                  className="flex flex-col items-center gap-2 group"
                  title={preset.label}
                >
                  <span
                    className={cn(
                      "block w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background",
                      isActive ? "ring-2 scale-110" : "hover:scale-105",
                    )}
                    style={{
                      backgroundColor: bgColor,
                      ...(isActive ? { ringColor: bgColor } : {}),
                    } as React.CSSProperties}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== 预览提示 ===== */}
        <div className="mt-10 p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            预览效果：
            <span className="font-medium" style={{ color: "var(--theme)" }}>
              这是主题色链接
            </span>
            ，切换后全局生效。
          </p>
        </div>
      </main>
    </>
  );
}
