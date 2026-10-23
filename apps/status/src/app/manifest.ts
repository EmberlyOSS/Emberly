import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Emberly Status',
        short_name: 'Emberly Status',
        description: 'Real-time service status and uptime monitoring for Emberly.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0c0a09',
        theme_color: '#F97316',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        categories: ['business', 'technology', 'productivity'],
        lang: 'en-GB',
        dir: 'ltr',
        scope: '/',
        related_applications: [],
        prefer_related_applications: false,
    };
}
