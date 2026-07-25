import { NextResponse } from "next/server";
import { db } from "@/db";
import { resume } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const [resumeData] = await db
    .select()
    .from(resume)
    .orderBy(desc(resume.updatedAt))
    .limit(1);

  return NextResponse.json(resumeData || null);
}
