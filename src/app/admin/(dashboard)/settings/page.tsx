"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error("两次密码不一致");
      return;
    }
    if (passwordForm.newPass.length < 6) {
      toast.error("密码至少6位");
      return;
    }
    setChanging(true);
    const res = await fetch("/api/admin/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
    });
    if (res.ok) {
      toast.success("密码已修改，请重新登录");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      signOut({ callbackUrl: "/admin/login" });
    } else {
      const data = await res.json();
      toast.error(data.error || "修改失败");
    }
    setChanging(false);
  };

  return (
    <div>
      <div className="max-w-sm">
        <h2 className="text-sm font-medium text-[#1A1A1A] mb-4">修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-[#6B7280]">当前密码</Label>
            <Input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              required
              className="border-[#E5E7EB] max-w-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#6B7280]">新密码</Label>
            <Input
              type="password"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              required
              className="border-[#E5E7EB] max-w-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#6B7280]">确认新密码</Label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              required
              className="border-[#E5E7EB] max-w-xs"
            />
          </div>
          <Button type="submit" disabled={changing} className="bg-[#1A1A1A] hover:bg-[#333] mt-1">
            {changing ? "修改中..." : "修改密码"}
          </Button>
        </form>
      </div>
    </div>
  );
}
