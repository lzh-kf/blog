"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MdEditor } from "@/components/admin/MdEditor";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function ResumePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/resume")
      .then(r => r.json())
      .then(data => {
        setContent(data.content || "");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      toast.success("简历已保存");
    } else {
      toast.error("保存失败");
    }
    setSaving(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#1A1A1A] hover:bg-[#333]">
          <Save className="h-4 w-4 mr-1" /> 保存
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-[#6B7280] py-12 text-center">加载中...</p>
      ) : (
        <div className="flex-1 min-h-0">
          <MdEditor value={content} onChange={setContent} height={800} />
        </div>
      )}
    </div>
  );
}
