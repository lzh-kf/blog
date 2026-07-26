"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Comment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  postSlug: string;
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", content: "" });

  useEffect(() => {
    fetch(`/api/comments?postSlug=${postSlug}&status=approved`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.content.trim()) {
      toast.error("请填写完整信息");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postSlug,
          authorName: form.name,
          authorEmail: form.email,
          content: form.content,
        }),
      });
      if (res.ok) {
        toast.success("评论已提交，审核后显示");
        setForm({ name: "", email: "", content: "" });
      } else {
        toast.error("提交失败，请稍后重试");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16">
      <Separator className="mb-8" />
      <h2 className="text-lg font-medium mb-6">评论</h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              昵称 *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="你的昵称"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              邮箱 *（不公开）
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm text-muted-foreground">
            评论内容 *
          </Label>
          <Textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="写下你的想法..."
            rows={4}
            className="resize-none"
          />
        </div>
        <Button type="submit" disabled={submitting} variant="outline">
          {submitting ? "提交中..." : "提交评论"}
        </Button>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无评论，来说两句吧</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-border last:border-0 pb-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {comment.authorName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
