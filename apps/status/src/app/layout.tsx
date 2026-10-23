import '../styles/globals.css';

import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import Script from 'next/script';
import ClientLayout from '@/components/ClientLayout';
import { SITE } from '@/lib/site';

// Inter matches the main Emberly site
const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE.statusUrl),
    title: {
        default: 'Emberly Status',
        template: '%s | Emberly Status',
    },
    description:
        'Real-time service status and uptime monitoring for Emberly. Track incidents, scheduled maintenance, and live service health.',
    applicationName: 'Emberly Status',
    keywords: [
        'Emberly',
        'status page',
        'uptime monitoring',
        'incident tracking',
        'service health',
        'system status',
        'maintenance schedule',
        'Emberly status',
    ],
    referrer: 'origin-when-cross-origin',
    category: 'technology',
    classification: 'Status Page',
    openGraph: {
        type: 'website',
        locale: 'en_GB',
        url: SITE.statusUrl,
        siteName: 'Emberly Status',
        title: 'Emberly Status',
        description:
            'Real-time service status and uptime monitoring for Emberly. Track incidents, scheduled maintenance, and live service health.',
        images: [
            {
                url: '/opengraph-image',
                width: 1200,
                height: 630,
                alt: 'Emberly Status',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@TryEmberly',
        title: 'Emberly Status',
        description:
            'Real-time service status and uptime monitoring for Emberly. Track incidents, scheduled maintenance, and live service health.',
        images: ['/twitter-image'],
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/logo.svg', type: 'image/svg+xml' },
        ],
        shortcut: '/favicon.ico',
        apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Emberly Status',
    },
    formatDetection: {
        telephone: false,
        email: false,
        address: false,
    },
    alternates: {
        canonical: SITE.statusUrl,
        languages: {
            'en-GB': SITE.statusUrl,
        },
    },
    other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'application-name': 'Emberly Status',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Emberly Status',
        url: SITE.statusUrl,
        description: 'Real-time service status and uptime monitoring for Emberly.',
        publisher: {
            '@type': 'Organization',
            name: 'Emberly',
            url: SITE.appUrl,
            logo: 'https://embrly.ca/icon.svg',
        },
        sameAs: [SITE.appUrl, SITE.github, SITE.discord],
    };

    return (
        <html lang="en">
            <head>
                {/* Structured Data */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

                {/* Fix for hydration issues */}
                <Script id="hydration-fix">
                    {`
            (function() {
              // This forces a rehydration if there was a hydration mismatch
              let rehydrated = false;
              window.__forcedRehydrate = function() {
                if (!rehydrated) {
                  rehydrated = true;
                  // Force reflow
                  document.body.style.display = 'none';
                  // Small delay to prevent flicker
                  setTimeout(function() {
                    document.body.style.display = '';
                  }, 10);
                }
              };
            })();
          `}
                </Script>
            </head>
            <body className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
