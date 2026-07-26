import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  title: string;
  slug: string;
  summary: string | null;
  category?: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } }[];
  publishedAt: Date | null;
  id?: string;
}

export function PostCard({ title, slug, summary, category, tags, publishedAt, id }: PostCardProps) {
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article id={id} className="py-8 border-b border-border last:border-b-0">
      <Link href={`/posts/${slug}`} className="group block">
        <h2 className="text-lg font-medium text-foreground group-hover:text-muted-foreground transition-colors leading-snug">
          {title}
        </h2>
        {summary && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {summary}
          </p>
        )}
      </Link>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {dateStr && <time>{dateStr}</time>}
        {category && (
          <Link
            href={`/categories/${category.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {category.name}
          </Link>
        )}
        {tags.slice(0, 3).map((pt) => (
          <Link key={pt.tag.slug} href={`/tags/${pt.tag.slug}`}>
            <Badge variant="secondary" className="text-xs font-normal">
              {pt.tag.name}
            </Badge>
          </Link>
        ))}
      </div>
    </article>
  );
}
