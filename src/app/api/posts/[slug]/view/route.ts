import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  await db
    .update(posts)
    .set({ viewCount: sql`view_count + 1` })
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .run();

  return NextResponse.json({ ok: true });
}
