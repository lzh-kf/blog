"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/admin/Pagination";
import { toast } from "sonner";
import { Check, X, Trash2, Search } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: number;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  ip: string;
  createdAt: string;
  post: { title: string; slug: string };
}

type FilterStatus = "pending" | "approved" | "spam";

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: filter,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/comments?${params}`);
    const data = await res.json();
    setComments(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filter, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleStatus = async (id: number, status: FilterStatus) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(status === "approved" ? "已通过" : status === "spam" ? "标为垃圾" : "已驳回");
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    toast.success("已删除");
    fetchData();
  };

  const tabs: { value: FilterStatus; label: string }[] = [
    { value: "pending", label: "待审核" },
    { value: "approved", label: "已通过" },
    { value: "spam", label: "垃圾" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {tabs.map(tab => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={filter === tab.value ? "bg-[#1A1A1A]" : "border-[#E5E7EB]"}
          >
            {tab.label}
          </Button>
        ))}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="搜索评论者或内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8 border-[#E5E7EB]"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} className="border-[#E5E7EB]">搜索</Button>
      </div>

      <div className="border border-[#E5E7EB] rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>文章</TableHead>
              <TableHead>评论者</TableHead>
              <TableHead>内容</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-[#6B7280] py-8">加载中...</TableCell></TableRow>
            ) : comments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-[#6B7280] py-8">暂无评论</TableCell></TableRow>
            ) : comments.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm max-w-[120px] truncate">
                  <Link href={`/posts/${c.post.slug}`} className="hover:text-[#6B7280]" target="_blank">{c.post.title}</Link>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{c.authorName}</span>
                  <span className="text-xs text-[#6B7280] ml-1">({c.authorEmail})</span>
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{c.content}</TableCell>
                <TableCell className="text-xs text-[#6B7280]">{new Date(c.createdAt).toLocaleString("zh-CN")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {filter === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleStatus(c.id, "approved")}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600" onClick={() => handleStatus(c.id, "spam")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {filter === "approved" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600" onClick={() => handleStatus(c.id, "spam")}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {filter === "spam" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleStatus(c.id, "approved")}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </div>
  );
}
