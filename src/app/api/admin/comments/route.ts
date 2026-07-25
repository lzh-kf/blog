import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq, desc, like, or, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const search = searchParams.get("search") || "";
  const pageParam = searchParams.get("page");
  const page = Math.max(Number(pageParam) || 1, 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 10, 5), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(comments.status, status as "pending" | "approved" | "spam")];

  if (search) {
    conditions.push(
      or(
        like(comments.authorName, `%${search}%`),
        like(comments.content, `%${search}%`)
      ) as ReturnType<typeof eq>
    );
  }

  const where = and(...conditions);

  const [result, total] = await Promise.all([
    db.query.comments.findMany({
      where,
      with: { post: { columns: { title: true, slug: true } } },
      orderBy: [desc(comments.createdAt)],
      ...(pageParam ? { limit: pageSize, offset } : {}),
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(where)
      .then((r) => Number(r[0].count)),
  ]);

  // 未传 page 参数时返回全量数组
  if (!pageParam) return NextResponse.json(result);

  return NextResponse.json({ items: result, total, page, pageSize });
}
