"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TOCItem } from "@/lib/toc";

interface PostTOCProps {
  headings: TOCItem[];
}

export function PostTOC({ headings }: PostTOCProps) {
  const [activeId, setActiveId] = useState<string>("");

  // 监听滚动，高亮当前可见的标题
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找出当前处于视口顶部区域的标题
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // 更新 URL hash
        window.history.pushState(null, "", `#${id}`);
        setActiveId(id);
      }
    },
    []
  );

  if (headings.length === 0) return null;

  return (
    <nav className="text-sm leading-relaxed">
      <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
        目录
      </h4>
      <ul className="space-y-1 border-l border-[#E5E7EB]">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: h.level === 3 ? "1rem" : "0" }}
          >
            <a
              href={`#${h.id}`}
              onClick={(e) => handleClick(e, h.id)}
              className={cn(
                "block py-1 pl-3 border-l-2 -ml-px text-[#6B7280] hover:text-[#1A1A1A] transition-colors",
                activeId === h.id
                  ? "border-[#1A1A1A] text-[#1A1A1A] font-medium"
                  : "border-transparent"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
