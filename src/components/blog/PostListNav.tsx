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
      <h4 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">
        文章列表
      </h4>
      <ul className="space-y-1 border-l border-border">
        {posts.map((p) => (
          <li key={p.slug}>
            <a
              href={`/posts/${p.slug}`}
              onClick={(e) => handleClick(e, p.slug)}
              className={cn(
                "block py-1 pl-3 border-l-2 -ml-px text-muted-foreground hover:text-foreground transition-colors truncate",
                activeSlug === p.slug
                  ? "border-[var(--theme)] text-foreground font-medium"
                  : "border-transparent"
              )}
              style={
                activeSlug === p.slug
                  ? { borderColor: "var(--theme)", color: "var(--theme)" }
                  : undefined
              }
            >
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
