import { Header } from "@/components/blog/Header";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db } from "@/db";
import { resume } from "@/db/schema";
import { Metadata } from "next";
import type { Components } from "react-markdown";

export const metadata: Metadata = {
  title: "个人简历",
};

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-[#1A1A1A] mt-8 mb-3 pb-1.5 border-b border-[#F0F0F0]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-[#333] mt-5 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[#444] leading-relaxed mb-2">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm text-[#444] leading-relaxed space-y-1 mb-3 pl-5 list-disc marker:text-[#999]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-[#444] leading-relaxed space-y-1 mb-3 pl-5 list-decimal marker:text-[#999]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[#1A1A1A]">{children}</strong>
  ),
  table: ({ children }) => (
    <div className="mb-5 overflow-hidden">
      <table className="w-full text-sm text-[#444]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-[#F5F5F5]">{children}</tr>,
  td: ({ children }) => (
    <td className="py-1.5 pr-4 align-top">{children}</td>
  ),
  th: ({ children }) => (
    <th className="py-1.5 pr-4 text-left font-medium text-[#1A1A1A] align-top whitespace-nowrap">
      {children}
    </th>
  ),
  hr: () => <hr className="my-6 border-[#EAEAEA]" />,
  code: ({ children }) => (
    <code className="text-xs bg-[#F5F5F5] text-[#555] px-1.5 py-0.5 rounded font-normal">
      {children}
    </code>
  ),
};

export default async function ResumePage() {
  const [resumeData] = await db.select().from(resume).limit(1);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {resumeData ? (
          <article className="resume-content">
            <ReactMarkdown
              components={components}
              remarkPlugins={[remarkGfm]}
            >
              {resumeData.content}
            </ReactMarkdown>
          </article>
        ) : (
          <p className="text-sm text-[#6B7280]">暂无内容</p>
        )}
      </main>
    </>
  );
}
