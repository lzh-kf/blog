"use client";

import { useState, useRef, useCallback, type JSX } from "react";
import MDEditor from "@uiw/react-md-editor";
import { getCommands, getExtraCommands } from "@uiw/react-md-editor/commands-cn";
import type { ICommand, TextAreaTextApi } from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MdEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  className?: string;
}

/** 图片上传按钮的 SVG 图标（与 @uiw/react-md-editor 默认图标一致） */
function ImageIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20">
      <path
        fill="currentColor"
        d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
      />
    </svg>
  );
}

export function MdEditor({ value, onChange, height = 500, className }: MdEditorProps) {
  const [mobilePreview, setMobilePreview] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const textApiRef = useRef<TextAreaTextApi | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !textApiRef.current) return;

    const loadingToast = toast.loading("正在上传图片…");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "上传失败", { id: loadingToast });
        return;
      }

      textApiRef.current.replaceSelection(`![${file.name}](${data.url})`);
      toast.success("图片上传成功", { id: loadingToast });
    } catch {
      toast.error("上传失败，请检查网络", { id: loadingToast });
    } finally {
      // 重置 input 以便可以重复上传同一文件
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }, []);

  /** 用上传版本替换默认的图片命令 */
  const commandsFilter = useCallback(
    (cmd: ICommand, isExtra: boolean) => {
      if (cmd.name === "image" && !isExtra) {
        return {
          ...cmd,
          execute: (_state: unknown, api: TextAreaTextApi) => {
            textApiRef.current = api;
            uploadInputRef.current?.click();
          },
          // 确保中文 tooltip 生效
          icon: <ImageIcon />,
          buttonProps: {
            "aria-label": "上传图片 (ctrl + k)",
            title: "上传图片 (ctrl + k)",
          },
        };
      }
      return cmd;
    },
    []
  );

  return (
    <div className={cn("flex flex-col md:flex-row gap-4", className)} data-color-mode="light">
      {/* 隐藏的文件选择器，点击图片按钮时触发 */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Desktop: side by side; Mobile: toggle */}
      <div className="hidden md:block w-full">
        <MDEditor
          value={value}
          onChange={(v) => onChange(v || "")}
          height={height}
          preview="live"
          visibleDragbar={false}
          commands={getCommands()}
          extraCommands={getExtraCommands()}
          commandsFilter={commandsFilter}
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
          commands={getCommands()}
          extraCommands={getExtraCommands()}
          commandsFilter={commandsFilter}
        />
      </div>
    </div>
  );
}
