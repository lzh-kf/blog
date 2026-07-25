import { Header } from "@/components/blog/Header";
import { PostCard } from "@/components/blog/PostCard";
import { db } from "@/db";
import { tags, posts, postTags } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const all = await db.query.tags.findMany({ columns: { slug: true } });
  return all.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
    columns: { name: true },
  });
  if (!tag) return { title: "标签不存在" };
  return { title: `#${tag.name}` };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });
  if (!tag) notFound();

  // 通过 post_tags 关联查找所有包含该标签的文章 ID
  const postIdRows = db
    .select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, tag.id))
    .all();

  const postIds = postIdRows.map((r) => r.postId);

  const allPosts =
    postIds.length > 0
      ? await db.query.posts.findMany({
          where: and(eq(posts.status, "published"), inArray(posts.id, postIds)),
          with: {
            category: { columns: { name: true, slug: true } },
            postTags: { with: { tag: { columns: { name: true, slug: true } } } },
          },
          orderBy: [desc(posts.publishedAt)],
        })
      : [];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-xl font-medium text-[#1A1A1A] mb-8">#{tag.name}</h1>
        {allPosts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            summary={post.summary}
            category={post.category}
            tags={post.postTags.map((pt) => ({ tag: pt.tag }))}
            publishedAt={post.publishedAt ? new Date(post.publishedAt) : null}
          />
        ))}
      </main>
    </>
  );
}
