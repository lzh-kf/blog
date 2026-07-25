"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { SidebarProvider, useSidebar } from "@/components/admin/SidebarContext";
import { SessionProvider } from "next-auth/react";
import { cn } from "@/lib/utils";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <div className={cn(
        "transition-[padding] duration-300 ease-in-out",
        collapsed ? "md:pl-16" : "md:pl-56"
      )}>
        <div className="pt-14 md:pt-0">
          <div className="p-4 md:p-6">
            <AdminBreadcrumb />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </SidebarProvider>
    </SessionProvider>
  );
}
