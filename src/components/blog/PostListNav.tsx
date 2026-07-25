"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface PostNavItem {
  slug: string;
  title: string;
}

interface PostListNavProps {
  posts: PostNavItem[];
}

export function PostListNav({ posts }: PostListNavProps) {
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    if (posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    const elements = posts
      .map((p) => document.getElementById(`post-${p.slug}`))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [posts]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
      e.preventDefault();
      const el = document.getElementById(`post-${slug}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#post-${slug}`);
        setActiveSlug(slug);
      }
    },
    []
  );

  if (posts.length === 0) return null;

  return (
    <nav className="text-sm leading-relaxed">
      <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
        文章列表
      </h4>
      <ul className="space-y-1 border-l border-[#E5E7EB]">
        {posts.map((p) => (
          <li key={p.slug}>
            <a
              href={`/posts/${p.slug}`}
              onClick={(e) => handleClick(e, p.slug)}
              className={cn(
                "block py-1 pl-3 border-l-2 -ml-px text-[#6B7280] hover:text-[#1A1A1A] transition-colors truncate",
                activeSlug === p.slug
                  ? "border-[#1A1A1A] text-[#1A1A1A] font-medium"
                  : "border-transparent"
              )}
            >
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
