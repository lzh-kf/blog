import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

export const markdownPlugins = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeHighlight, rehypeSlug],
};
