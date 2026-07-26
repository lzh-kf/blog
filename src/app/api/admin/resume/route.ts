import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resume } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const [result] = await db
    .select()
    .from(resume)
    .orderBy(desc(resume.updatedAt))
    .limit(1);
  return NextResponse.json(result || { content: "" });
}

export async function PUT(req: NextRequest) {
  const { content } = await req.json();
  // Upsert: 有则更新，无则创建
  const [existing] = await db.select().from(resume).limit(1);
  if (existing) {
    await db.update(resume).set({ content }).where(eq(resume.id, existing.id)).run();
  } else {
    await db.insert(resume).values({ content }).run();
  }
  const [result] = await db.select().from(resume).limit(1);
  return NextResponse.json(result);
}
