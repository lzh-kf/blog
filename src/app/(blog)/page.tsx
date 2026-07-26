import { Header } from "@/components/blog/Header";
import { PostCard } from "@/components/blog/PostCard";
import { PostListNav } from "@/components/blog/PostListNav";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const revalidate = 60;

export default async function HomePage() {
  const allPosts = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    with: {
      category: { columns: { name: true, slug: true } },
      postTags: { with: { tag: { columns: { name: true, slug: true } } } },
    },
    orderBy: [desc(posts.isTop), desc(posts.publishedAt)],
  });

  const navItems = allPosts.map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <>
      <Header />

      {/* 文章列表导航 — 大屏时浮动在左侧，不影响文章居中 */}
      {navItems.length > 0 && (
        <aside className="hidden xl:block fixed right-[max(1.5rem,calc((100vw-48rem)/2-12rem))] top-24 w-40 z-10">
          <PostListNav posts={navItems} />
        </aside>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        {allPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">暂无文章</p>
        ) : (
          <div>
            {allPosts.map((post) => (
              <PostCard
                key={post.id}
                id={`post-${post.slug}`}
                title={post.title}
                slug={post.slug}
                summary={post.summary}
                category={post.category}
                tags={post.postTags.map((pt) => ({ tag: pt.tag }))}
                publishedAt={post.publishedAt ? new Date(post.publishedAt) : null}
              />
            ))}
          </div>
        )}

      </main>
    </>
  );
}
