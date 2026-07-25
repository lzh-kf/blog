import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export async function GET() {
  const allCategories = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
  });

  // 统计每个分类下已发布文章数
  const postCounts = await db
    .select({
      categoryId: posts.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .groupBy(posts.categoryId);

  const countMap = new Map(postCounts.map((r) => [r.categoryId, r.count]));

  const result = allCategories.map((c) => ({
    ...c,
    _count: { posts: countMap.get(c.id) || 0 },
  }));

  return NextResponse.json(result);
}
