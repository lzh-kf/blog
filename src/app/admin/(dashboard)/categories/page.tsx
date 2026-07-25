"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/admin/Pagination";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  _count: { posts: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/categories?${params}`);
    const data = await res.json();
    setCategories(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", description: "", sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description || "", sortOrder: c.sortOrder });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error("名称和Slug必填"); return; }
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editingId ? "已更新" : "已创建");
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    toast.success("已删除");
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button size="sm" onClick={openCreate} className="bg-[#1A1A1A] hover:bg-[#333]">
          <Plus className="h-4 w-4 mr-1" /> 添加
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="搜索分类..."
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
              <TableHead>名称</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>文章数</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-[#6B7280] py-8">加载中...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-[#6B7280] py-8">暂无分类</TableCell></TableRow>
            ) : categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-sm">{c.name}</TableCell>
                <TableCell className="text-sm text-[#6B7280]">{c.slug}</TableCell>
                <TableCell className="text-sm text-[#6B7280]">{c.description || "-"}</TableCell>
                <TableCell className="text-sm">{c._count.posts}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm border-[#E5E7EB]">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">{editingId ? "编辑分类" : "添加分类"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-sm">名称</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border-[#E5E7EB]" /></div>
            <div className="space-y-1"><Label className="text-sm">Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="border-[#E5E7EB]" /></div>
            <div className="space-y-1"><Label className="text-sm">描述</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border-[#E5E7EB]" /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="bg-[#1A1A1A] hover:bg-[#333]">保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
