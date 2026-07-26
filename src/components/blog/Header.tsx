"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/resume", label: "简历" },
];

interface HeaderProps {
  backUrl?: string;
  backLabel?: string;
}

export function Header({ backUrl, backLabel = "返回" }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-3xl mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {backUrl && (
            <Link
              href={backUrl}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          )}
          <Link
            href="/"
            className="text-base font-medium text-[var(--theme)] hover:opacity-75 transition-colors"
            style={{ color: "var(--theme)" } as React.CSSProperties}
          >
            博客
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </nav>

        {/* Mobile nav toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile nav menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all",
          open ? "max-h-48 border-b border-border" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 pb-4 gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            设置
          </Link>
        </nav>
      </div>
    </header>
  );
}
