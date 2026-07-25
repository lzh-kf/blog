import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { posts, comments, categories, tags } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const [postCountResult, commentPendingResult, categoryCountResult, tagCountResult] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(posts),
      db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db.select({ count: sql<number>`count(*)` }).from(tags),
    ]);

  const stats = [
    { label: "文章总数", value: Number(postCountResult[0].count) },
    { label: "待审核评论", value: Number(commentPendingResult[0].count) },
    { label: "分类数", value: Number(categoryCountResult[0].count) },
    { label: "标签数", value: Number(tagCountResult[0].count) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-[#E5E7EB] shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-[#6B7280]">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium text-[#1A1A1A]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
