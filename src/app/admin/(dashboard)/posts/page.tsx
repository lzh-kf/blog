"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/admin/Pagination";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
  isTop: boolean;
  publishedAt: string | null;
  createdAt: string;
  category?: { name: string } | null;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = () => {
    setPage(1);
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("已删除");
        fetchPosts();
      }
    } catch {
      toast.error("删除失败");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link href="/admin/posts/new">
          <Button size="sm" className="bg-[#1A1A1A] hover:bg-[#333]">
            <Plus className="h-4 w-4 mr-1" /> 写文章
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="搜索标题或摘要..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8 border-[#E5E7EB]"
          />
        </div>
        <Select value={status} onValueChange={(v) => { if (v) { setStatus(v); setPage(1); } }}>
          <SelectTrigger className="w-[110px] border-[#E5E7EB]">
            {status === "all" ? "全部" : status === "published" ? "已发布" : "草稿"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleSearch} className="border-[#E5E7EB]">
          搜索
        </Button>
      </div>

      <div className="border border-[#E5E7EB] rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">标题</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>置顶</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-[#6B7280] py-8">加载中...</TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-[#6B7280] py-8">暂无文章</TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium text-sm">
                    <Link href={`/posts/${post.slug}`} target="_blank" className="hover:text-[#6B7280]">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{post.category?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs font-normal">
                      {post.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{post.isTop ? "是" : "-"}</TableCell>
                  <TableCell className="text-sm text-[#6B7280]">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("zh-CN") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </div>
  );
}
