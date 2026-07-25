import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, comments } from "@/db/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { sendCommentNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");
  const status = searchParams.get("status") || "approved";

  if (!postSlug) {
    return NextResponse.json({ error: "postSlug is required" }, { status: 400 });
  }

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, postSlug))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // 获取顶层评论（parentId IS NULL）及其回复
  const result = await db.query.comments.findMany({
    where: and(
      eq(comments.postId, post.id),
      eq(comments.status, status as "approved" | "pending" | "spam"),
      sql`${comments.parentId} IS NULL`
    ),
    orderBy: [desc(comments.createdAt)],
    with: {
      replies: {
        where: eq(comments.status, status as "approved"),
        orderBy: [asc(comments.createdAt)],
      },
    },
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postSlug, authorName, authorEmail, content, parentId } = body;

    if (!postSlug || !authorName || !authorEmail || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [post] = await db
      .select({ id: posts.id, title: posts.title, slug: posts.slug })
      .from(posts)
      .where(eq(posts.slug, postSlug))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const result = db
      .insert(comments)
      .values({
        postId: post.id,
        parentId: parentId || null,
        authorName,
        authorEmail,
        content,
        ip,
        status: "pending",
      })
      .run();

    // 异步发送邮件通知
    sendCommentNotification({
      postTitle: post.title,
      postSlug: post.slug,
      authorName,
      content,
    }).catch(console.error);

    return NextResponse.json({ id: Number(result.lastInsertRowid), status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
