import { Header } from "@/components/blog/Header";
import { PostCard } from "@/components/blog/PostCard";
import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    columns: { name: true },
  });
  if (!cat) return { title: "分类不存在" };
  return { title: cat.name };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
  if (!cat) notFound();

  const allPosts = await db.query.posts.findMany({
    where: and(eq(posts.status, "published"), eq(posts.categoryId, cat.id)),
    with: {
      category: { columns: { name: true, slug: true } },
      postTags: { with: { tag: { columns: { name: true, slug: true } } } },
    },
    orderBy: [desc(posts.publishedAt)],
  });

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-xl font-medium text-foreground mb-2">{cat.name}</h1>
        {cat.description && (
          <p className="text-sm text-muted-foreground mb-8">{cat.description}</p>
        )}
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
