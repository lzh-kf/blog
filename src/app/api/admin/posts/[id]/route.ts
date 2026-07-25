import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postTags } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, Number(id)),
    with: { postTags: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, slug, summary, content, categoryId, tagIds, status, isTop } = body;

    const numId = Number(id);

    // 检查 slug 冲突
    if (slug) {
      const [existing] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, slug), ne(posts.id, numId)))
        .limit(1);
      if (existing) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }
    }

    // 如果从草稿变为发布，设置发布时间
    let publishedAt: string | undefined;
    if (status === "published") {
      const [old] = await db
        .select({ status: posts.status })
        .from(posts)
        .where(eq(posts.id, numId))
        .limit(1);
      if (old && old.status === "draft") {
        publishedAt = new Date().toISOString();
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (status !== undefined) updateData.status = status;
    if (isTop !== undefined) updateData.isTop = isTop;
    if (publishedAt) updateData.publishedAt = publishedAt;

    if (Object.keys(updateData).length > 0) {
      db.update(posts).set(updateData).where(eq(posts.id, numId)).run();
    }

    // 更新标签（删旧建新）
    if (tagIds !== undefined) {
      db.delete(postTags).where(eq(postTags.postId, numId)).run();
      for (const tagId of tagIds) {
        db.insert(postTags).values({ postId: numId, tagId }).run();
      }
    }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, numId),
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(posts).where(eq(posts.id, Number(id))).run();
  return NextResponse.json({ success: true });
}
