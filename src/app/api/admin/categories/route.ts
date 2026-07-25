import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, like, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const pageParam = searchParams.get("page");
  const page = Math.max(Number(pageParam) || 1, 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 10, 5), 100);
  const offset = (page - 1) * pageSize;

  const where = search
    ? or(like(categories.name, `%${search}%`), like(categories.slug, `%${search}%`))
    : undefined;

  const [result, total] = await Promise.all([
    db.query.categories.findMany({
      where,
      orderBy: [asc(categories.sortOrder)],
      with: { posts: { columns: { id: true } } },
      ...(pageParam ? { limit: pageSize, offset } : {}),
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(where)
      .then((r) => Number(r[0].count)),
  ]);

  const data = result.map((c) => ({
    ...c,
    _count: { posts: c.posts.length },
  }));

  // 未传 page 参数时返回全量数组（兼容旧调用方如 PostEditor）
  if (!pageParam) return NextResponse.json(data);

  return NextResponse.json({ items: data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, description, sortOrder } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }
  const result = db
    .insert(categories)
    .values({ name, slug, description, sortOrder: sortOrder || 0 })
    .run();
  return NextResponse.json({ id: Number(result.lastInsertRowid), name, slug }, { status: 201 });
}
