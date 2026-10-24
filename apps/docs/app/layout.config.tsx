import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { type LinkItemType } from 'fumadocs-ui/layouts/docs'
import { FaDiscord } from 'react-icons/fa'
import { X, Rocket, BookUser, Plug, Braces, Shield, Server } from 'lucide-react'
import Image from 'next/image'

export const linkItems: LinkItemType[] = [
  {
    type: 'icon',
    text: 'Discord',
    icon: <FaDiscord className="size-4" />,
    url: 'https://discord.gg/36spBmzZVB',
    label: 'Discord',
  },
  {
    type: 'icon',
    text: 'Twitter / X',
    icon: <X className="size-4" />,
    url: 'https://twitter.com/TryEmberly',
    label: 'Twitter / X',
  },
]

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/EmberlyOSS',
  nav: {
    title: (
      <span className="flex items-center gap-2 text-base font-bold">
        <Image
          src="/icon.svg"
          alt="Emberly"
          width={22}
          height={22}
          className="rounded-sm"
        />
        Emberly Docs
      </span>
    ),
    url: '/',
  },
  links: [
    {
      type: 'menu',
      text: 'Documentation',
      url: '/getting-started',
      items: [
        {
          icon: <Rocket className="size-4" />,
          text: 'Getting Started',
          description: 'Create your account and upload your first file.',
          url: '/getting-started',
        },
        {
          icon: <BookUser className="size-4" />,
          text: 'User Guide',
          description: 'File management, domains, teams, and settings.',
          url: '/user-guide',
        },
        {
          icon: <Plug className="size-4" />,
          text: 'Integrations',
          description: 'ShareX, Flicker, Flameshot, Python SDK, and more.',
          url: '/integrations',
        },
        {
          icon: <Braces className="size-4" />,
          text: 'API Reference',
          description: 'Full REST API for files, domains, and accounts.',
          url: '/api',
        },
        {
          icon: <Shield className="size-4" />,
          text: 'Security',
          description: 'VirusTotal scanning, HIBP checks, and encryption.',
          url: '/security',
        },
        {
          icon: <Server className="size-4" />,
          text: 'Self-Hosting',
          description: 'Deploy your own Emberly on any infrastructure.',
          url: '/self-hosting',
        },
      ],
    },
    {
      text: 'Main Website',
      url: 'https://embrly.ca',
    },
    ...linkItems,
  ],
}
