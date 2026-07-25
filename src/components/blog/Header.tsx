"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="max-w-3xl mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {backUrl && (
            <Link
              href={backUrl}
              className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          )}
          <Link href="/" className="text-base font-medium text-[#1A1A1A] hover:text-[#6B7280] transition-colors">
            博客
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
            >
              {link.label}
            </Link>
          ))}
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
          open ? "max-h-48 border-b border-[#E5E7EB]" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 pb-4 gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
