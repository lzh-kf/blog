import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { markdownPlugins } from "@/lib/markdown";

interface MarkdownRendererProps {
  content: string;
}

/** 从 alt 文本中提取语言标签（Juejin 格式：image.png 等） */
function getLanguageFromCodeBlock(className?: string) {
  if (!className) return null;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
}

const markdownComponents: Partial<Components> = {
  // 图片：支持标题、居中、点击放大
  img({ src, alt, ...props }) {
    if (!src) return null;
    return (
      <span className="block my-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ""}
          className="rounded-lg border border-[#E5E7EB] max-w-full h-auto mx-auto shadow-sm"
          loading="lazy"
          {...props}
        />
        {alt && !alt.endsWith(".png") && !alt.endsWith(".jpg") && !alt.endsWith(".webp") && !alt.endsWith(".image") && (
          <span className="block mt-2 text-sm text-[#6B7280]">{alt}</span>
        )}
      </span>
    );
  },

  // 代码块：显示语言标签
  pre({ children, ...props }) {
    // 尝试提取代码块的语言
    const codeChild = Array.isArray(children) ? children[0] : children;
    const className =
      codeChild && typeof codeChild === "object" && "props" in codeChild
        ? (codeChild.props as { className?: string }).className
        : undefined;
    const lang = getLanguageFromCodeBlock(className);

    return (
      <div className="relative group my-5">
        {lang && (
          <span className="absolute top-0 right-4 -translate-y-full rounded-t bg-[#E5E7EB] px-3 py-0.5 text-xs text-[#6B7280] font-mono">
            {lang}
          </span>
        )}
        <pre
          className="bg-[#F5F5F5] rounded-lg p-4 overflow-x-auto text-sm leading-relaxed border border-[#E5E7EB]"
          {...props}
        >
          {children}
        </pre>
      </div>
    );
  },

  // 外链：新窗口打开
  a({ href, children, ...props }) {
    const isExternal = href && (href.startsWith("http://") || href.startsWith("https://"));
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-[#1A1A1A] underline underline-offset-2 decoration-[#D1D5DB] hover:decoration-[#1A1A1A] transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },

  // 引用块：更好的视觉区分
  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="border-l-4 border-[#D1D5DB] pl-4 my-5 text-[#6B7280] italic"
        {...props}
      >
        {children}
      </blockquote>
    );
  },

  // 表格：更好的响应式样式
  table({ children, ...props }) {
    return (
      <div className="overflow-x-auto my-5">
        <table
          className="min-w-full border-collapse border border-[#E5E7EB] text-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },

  th({ children, ...props }) {
    return (
      <th
        className="border border-[#E5E7EB] bg-[#F5F5F5] px-4 py-2 text-left font-medium"
        {...props}
      >
        {children}
      </th>
    );
  },

  td({ children, ...props }) {
    return (
      <td className="border border-[#E5E7EB] px-4 py-2" {...props}>
        {children}
      </td>
    );
  },
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-medium prose-headings:text-[#1A1A1A] prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2 prose-p:text-[#333] prose-p:leading-relaxed prose-strong:text-[#1A1A1A] prose-code:text-sm prose-code:bg-[#F5F5F5] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:my-4 prose-ol:my-4 prose-li:text-[#333] prose-li:leading-relaxed">
      <ReactMarkdown components={markdownComponents} {...markdownPlugins}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
