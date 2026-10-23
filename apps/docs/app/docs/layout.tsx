import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions, linkItems } from '@/app/layout.config';
import { source } from '@/lib/source';

const sectionColors: Record<string, string> = {
  'getting-started': 'var(--getting-started-color)',
  'user-guide': 'var(--user-guide-color)',
  integrations: 'var(--integrations-color)',
  api: 'var(--api-color)',
  security: 'var(--security-color)',
  'self-hosting': 'var(--self-hosting-color)',
  staff: 'var(--staff-color)',
};

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  links: linkItems,
  sidebar: {
    tabs: {
      transform(option, node) {
        const meta = source.getNodeMeta(node);
        if (!meta) return option;
        const color = sectionColors[meta.file.dirname];
        if (!color) return option;
        return {
          ...option,
          icon: (
            <div
              className="rounded-md border p-1 shadow-md [&_svg]:size-5"
              style={{
                color: color,
                backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
              }}
            >
              {option.icon}
            </div>
          ),
        };
      },
    },
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
