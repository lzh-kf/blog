import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  db.update(tags).set(body).where(eq(tags.id, Number(id))).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(tags).where(eq(tags.id, Number(id))).run();
  return NextResponse.json({ success: true });
}
