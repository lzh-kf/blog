import { ThemeProvider } from "@/components/blog/ThemeProvider";
import { BlogShell } from "@/components/blog/BlogShell";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <BlogShell>{children}</BlogShell>
    </ThemeProvider>
  );
}
