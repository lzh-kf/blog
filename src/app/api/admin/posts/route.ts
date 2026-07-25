import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postTags } from "@/db/schema";
import { eq, like, or, desc, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const pageParam = searchParams.get("page");
  const page = Math.max(Number(pageParam) || 1, 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 10, 5), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status !== "all") {
    conditions.push(eq(posts.status, status));
  }
  if (search) {
    conditions.push(
      or(
        like(posts.title, `%${search}%`),
        like(posts.summary, `%${search}%`)
      ) as ReturnType<typeof eq>
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allPosts, total] = await Promise.all([
    db.query.posts.findMany({
      where,
      with: { category: { columns: { name: true } } },
      orderBy: [desc(posts.updatedAt)],
      ...(pageParam ? { limit: pageSize, offset } : {}),
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(where)
      .then((r) => Number(r[0].count)),
  ]);

  // 未传 page 参数时返回全量（兼容旧调用方）
  if (!pageParam) return NextResponse.json({ posts: allPosts, total });

  return NextResponse.json({ posts: allPosts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, summary, content, categoryId, tagIds, status, isTop } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const result = db
      .insert(posts)
      .values({
        title,
        slug,
        summary: summary || null,
        content,
        categoryId: categoryId || null,
        status: status || "draft",
        isTop: isTop || false,
        publishedAt: status === "published" ? new Date().toISOString() : null,
      })
      .run();

    const postId = Number(result.lastInsertRowid);

    if (tagIds?.length) {
      for (const tagId of tagIds) {
        db.insert(postTags).values({ postId, tagId }).run();
      }
    }

    return NextResponse.json({ id: postId }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
