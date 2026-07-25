"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

interface MdEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  className?: string;
}

export function MdEditor({ value, onChange, height = 500, className }: MdEditorProps) {
  const [mobilePreview, setMobilePreview] = useState(false);

  return (
    <div className={cn("flex flex-col md:flex-row gap-4", className)} data-color-mode="light">
      {/* Desktop: side by side; Mobile: toggle */}
      <div className="hidden md:block w-full">
        <MDEditor
          value={value}
          onChange={(v) => onChange(v || "")}
          height={height}
          preview="live"
          visibleDragbar={false}
        />
      </div>

      {/* Mobile: toggle edit/preview */}
      <div className="md:hidden w-full">
        <div className="flex border-b border-[#E5E7EB] mb-2">
          <button
            className={cn(
              "px-4 py-2 text-sm cursor-pointer",
              !mobilePreview ? "border-b-2 border-[#1A1A1A] text-[#1A1A1A]" : "text-[#6B7280]"
            )}
            onClick={() => setMobilePreview(false)}
          >
            编辑
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm cursor-pointer",
              mobilePreview ? "border-b-2 border-[#1A1A1A] text-[#1A1A1A]" : "text-[#6B7280]"
            )}
            onClick={() => setMobilePreview(true)}
          >
            预览
          </button>
        </div>
        <MDEditor
          value={value}
          onChange={(v) => onChange(v || "")}
          height={height}
          preview={mobilePreview ? "preview" : "edit"}
          visibleDragbar={false}
        />
      </div>
    </div>
  );
}
