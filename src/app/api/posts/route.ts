import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, categories, tags, postTags } from "@/db/schema";
import { eq, like, desc, and, or, inArray, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "published";
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const conditions: ReturnType<typeof eq>[] = [];

  if (status !== "all") {
    conditions.push(eq(posts.status, status));
  }

  // 分类过滤：通过分类 slug 查找 categoryId
  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (!cat) {
      return NextResponse.json({ posts: [], total: 0, page, limit });
    }
    conditions.push(eq(posts.categoryId, cat.id));
  }

  // 标签过滤：通过 post_tags 关联查找 postId
  if (tag) {
    const tagRows = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(tags.slug, tag));

    const postIds = tagRows.map((r) => r.postId);
    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], total: 0, page, limit });
    }
    conditions.push(inArray(posts.id, postIds));
  }

  // 搜索过滤
  if (search) {
    conditions.push(
      or(
        like(posts.title, `%${search}%`),
        like(posts.summary, `%${search}%`)
      ) as ReturnType<typeof eq>
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [postsData, totalResult] = await Promise.all([
    db.query.posts.findMany({
      where,
      with: {
        category: { columns: { name: true, slug: true } },
        postTags: { with: { tag: { columns: { name: true, slug: true } } } },
      },
      orderBy: [desc(posts.isTop), desc(posts.publishedAt)],
      offset: (page - 1) * limit,
      limit,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(where)
      .then((r) => Number(r[0].count)),
  ]);

  // 保持与之前的 Prisma 返回格式一致（tags 字段名而非 postTags）
  const result = postsData.map((post) => ({
    ...post,
    tags: post.postTags,
  }));

  return NextResponse.json({ posts: result, total: totalResult, page, limit });
}
