import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags, postTags } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  const allTags = await db.query.tags.findMany({
    orderBy: [desc(tags.createdAt)],
  });

  // 统计每个标签下的文章数
  const postCounts = await db
    .select({
      tagId: postTags.tagId,
      count: sql<number>`count(*)`,
    })
    .from(postTags)
    .groupBy(postTags.tagId);

  const countMap = new Map(postCounts.map((r) => [r.tagId, r.count]));

  const result = allTags.map((t) => ({
    ...t,
    _count: { posts: countMap.get(t.id) || 0 },
  }));

  return NextResponse.json(result);
}
