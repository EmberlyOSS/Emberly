import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import {
  remarkAdmonition,
  remarkHeading,
  remarkImage,
  rehypeCode,
} from 'fumadocs-core/mdx-plugins';

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkAdmonition, // ::: note / warning / danger admonition blocks
      remarkHeading,    // heading IDs + TOC extraction
      remarkImage,      // auto width/height on MDX images
    ],
    rehypePlugins: (v) => [
      [rehypeCode, { themes: { light: 'github-light', dark: 'one-dark-pro' } }],
      ...v,
    ],
  },
});
