export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/** 从 markdown 中提取 h2/h3 标题，生成与 rehype-slug 一致的 id */
export function extractHeadings(content: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TOCItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ id, text, level });
  }
  return headings;
}

/** 模拟 rehype-slug（github-slugger）的 slug 生成逻辑 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w一-鿿\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
