"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  admin: "仪表盘",
  posts: "文章管理",
  new: "写文章",
  edit: "编辑文章",
  categories: "分类管理",
  tags: "标签管理",
  resume: "简历编辑",
  comments: "评论管理",
  settings: "系统设置",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();

  let segments = pathname.split("/").filter(Boolean);
  // 去掉 admin 根段（仅当还有子页面时）
  if (segments[0] === "admin" && segments.length > 1) {
    segments = segments.slice(1);
  }
  // 构建面包屑项：每项包含 label 和 href
  const items = segments
    .map((seg, i) => {
      const label = labelMap[seg];
      if (!label) return null;
      // href 需要补回 admin 前缀
      const fullSegments = ["admin", ...segments.slice(0, i + 1)];
      return {
        label,
        href: "/" + fullSegments.join("/"),
      };
    })
    .filter(Boolean) as { label: string; href: string }[];

  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-[#6B7280] mb-2">
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" />}
          {i === items.length - 1 ? (
            <span className="text-[#1A1A1A] font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-[#1A1A1A] transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
