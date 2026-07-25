"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FolderOpen, Tag, FileUser, MessageSquare, Settings, LayoutDashboard, Menu, X, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useSidebar } from "@/components/admin/SidebarContext";

const menuItems = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/posts", label: "文章管理", icon: FileText },
  { href: "/admin/categories", label: "分类管理", icon: FolderOpen },
  { href: "/admin/tags", label: "标签管理", icon: Tag },
  { href: "/admin/resume", label: "简历编辑", icon: FileUser },
  { href: "/admin/comments", label: "评论管理", icon: MessageSquare },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutOpen(false);
    await signOut({ callbackUrl: "/admin/login" });
  };

  const sidebarContent = (
    <nav className="flex flex-col flex-1 p-3">
      <div className="flex-1 flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-[#F5F5F5] text-[#1A1A1A] font-medium"
                  : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn(
                "transition-opacity duration-200 whitespace-nowrap",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 退出按钮 */}
      <button
        onClick={() => setLogoutOpen(true)}
        title={collapsed ? "退出登录" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#6B7280] hover:text-red-600 hover:bg-[#FEF2F2] transition-colors mt-2 cursor-pointer",
          collapsed && "justify-center px-0"
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className={cn(
          "transition-opacity duration-200 whitespace-nowrap",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>退出登录</span>
      </button>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-[#E5E7EB] bg-[#FAFAFA] transition-[width] duration-300 ease-in-out overflow-hidden",
          collapsed ? "md:w-16" : "md:w-56"
        )}
      >
        <div className={cn(
          "flex items-center h-14 px-4 border-b border-[#E5E7EB]",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <span className={cn(
            "font-medium text-sm text-[#1A1A1A] transition-opacity duration-200 whitespace-nowrap",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>管理后台</span>
          <button
            onClick={toggle}
            className="p-1 rounded hover:bg-[#E5E7EB] transition-colors cursor-pointer text-[#6B7280]"
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 border-b border-[#E5E7EB] bg-white">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <span className="ml-2 font-medium text-sm">管理后台</span>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setMobileOpen(false)}>
            <div
              className="fixed inset-y-0 left-0 w-56 bg-[#FAFAFA] border-r border-[#E5E7EB] z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-14 items-center justify-between px-4 border-b border-[#E5E7EB]">
                <span className="font-medium text-sm">管理后台</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}
      </div>

      {/* 退出确认弹窗 */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">退出登录</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">确定要退出管理后台吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)} className="border-[#E5E7EB]">
              取消
            </Button>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
