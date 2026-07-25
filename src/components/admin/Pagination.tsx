"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="flex items-center justify-end gap-4 mt-4 text-sm text-[#6B7280]">
      <span>
        共 {total} 条，第 {page}/{totalPages} 页
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="border-[#E5E7EB] h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm">{page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="border-[#E5E7EB] h-8 px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
