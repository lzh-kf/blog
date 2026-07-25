"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { MdEditor } from "@/components/admin/MdEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Send } from "lucide-react";

interface CategoryOption { id: number; name: string; }
interface TagOption { id: number; name: string; }

interface PostEditorProps {
  postId?: number; // undefined = create mode
}

export function PostEditor({ postId }: PostEditorProps) {
  const isNew = postId === undefined;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isTop, setIsTop] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/tags").then(r => r.json()),
    ]).then(([cats, tgs]) => {
      setCategories(cats || []);
      setTags(tgs || []);
    });

    if (!isNew && postId) {
      fetch(`/api/admin/posts/${postId}`)
        .then(r => r.json())
        .then((post) => {
          if (post) {
            setTitle(post.title);
            setSlug(post.slug);
            setSummary(post.summary || "");
            setContent(post.content);
            setCategoryId(post.categoryId ? String(post.categoryId) : "");
            setSelectedTags(post.postTags?.map((pt: { tagId: number }) => pt.tagId) || []);
            setStatus(post.status);
            setIsTop(post.isTop);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [postId, isNew]);

  const generateSlug = (t: string) => {
    if (/[一-龥]/.test(t)) return Date.now().toString(36);
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleTitleChange = (t: string) => {
    setTitle(t);
    if (isNew) setSlug(generateSlug(t));
  };

  const handleSave = async (publishStatus: "draft" | "published") => {
    if (!title.trim() || !content.trim()) {
      toast.error("标题和内容不能为空");
      return;
    }
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${postId}`;
      const body = {
        title, slug: slug || generateSlug(title), summary, content,
        categoryId: categoryId ? Number(categoryId) : null,
        tagIds: selectedTags, status: publishStatus, isTop,
      };
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(publishStatus === "published" ? "发布成功" : "已保存草稿");
        if (isNew) router.replace(`/admin/posts/${data.id}/edit`);
      } else {
        const err = await res.json();
        toast.error(err.error || "保存失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  if (loading) {
    return <p className="text-sm text-[#6B7280] py-12 text-center">加载中...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/posts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium text-[#1A1A1A]">{isNew ? "写文章" : "编辑文章"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving} className="border-[#E5E7EB]">
            <Save className="h-4 w-4 mr-1" /> 存草稿
          </Button>
          <Button size="sm" onClick={() => handleSave("published")} disabled={saving} className="bg-[#1A1A1A] hover:bg-[#333]">
            <Send className="h-4 w-4 mr-1" /> 发布
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input value={title} onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="文章标题"
          className="text-xl font-medium border-none border-b border-[#E5E7EB] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#1A1A1A]" />
      </div>
      <div className="mb-4">
        <Input value={slug} onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (URL 标识)" className="text-sm border-[#E5E7EB]" />
      </div>

      <div className="mb-6">
        <MdEditor value={content} onChange={setContent} height={500} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#E5E7EB] pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-[#6B7280]">摘要</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder="文章摘要..." rows={3} className="border-[#E5E7EB] resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-[#6B7280]">分类</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")}>
              <SelectTrigger className="border-[#E5E7EB]">
                {categoryId ? categories.find(c => String(c.id) === categoryId)?.name || "选择分类" : "选择分类"}
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-[#6B7280]">标签</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button key={tag.id} onClick={() => toggleTag(tag.id)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                  selectedTags.includes(tag.id) ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "text-[#6B7280] border-[#E5E7EB] hover:border-[#1A1A1A]"
                }`}>
                {tag.name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox id="isTop" checked={isTop} onChange={(e) => setIsTop(e.target.checked)}>
              <span className="text-sm text-[#6B7280]">置顶文章</span>
            </Checkbox>
          </div>
          <div className="text-sm text-[#6B7280]">
            状态：<span className="font-medium text-[#1A1A1A]">{status === "published" ? "已发布" : "草稿"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
