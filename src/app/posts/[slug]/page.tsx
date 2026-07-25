import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/blog/Header";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostTOC } from "@/components/blog/PostTOC";
import { extractHeadings } from "@/lib/toc";
import { CommentSection } from "@/components/blog/CommentSection";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const allPosts = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    columns: { slug: true },
  });
  return allPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    columns: { title: true, summary: true },
  });
  if (!post) return { title: "文章不存在" };
  return {
    title: post.title,
    description: post.summary || post.title,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  // 增加阅读量（原子操作）
  db.update(posts)
    .set({ viewCount: sql`view_count + 1` })
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .run();

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      category: { columns: { name: true, slug: true } },
      postTags: { with: { tag: { columns: { name: true, slug: true } } } },
    },
  });

  if (!post || post.status !== "published") {
    notFound();
  }

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const headings = extractHeadings(post.content);

  return (
    <>
      <Header backUrl="/" backLabel="首页" />

      {/* TOC 目录 — 大屏时浮动在右侧，不影响文章居中 */}
      {headings.length > 0 && (
        <aside className="hidden xl:block fixed right-[max(1.5rem,calc((100vw-48rem)/2-12rem))] top-24 w-40 z-10">
          <PostTOC headings={headings} />
        </aside>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <article>
          <header className="mb-8">
            <h1 className="text-2xl font-medium text-[#1A1A1A] leading-snug">
              {post.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-[#6B7280] flex-wrap">
              {dateStr && <time>{dateStr}</time>}
              {post.category && <span>{post.category.name}</span>}
            </div>
            {post.postTags.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {post.postTags.map((pt) => (
                  <Badge key={pt.tag.slug} variant="secondary" className="font-normal">
                    {pt.tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          <MarkdownRenderer content={post.content} />
        </article>

        <CommentSection postSlug={post.slug} />
      </main>
    </>
  );
}
