import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE.statusUrl;
    const currentDate = new Date();

    return [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'always',
            priority: 1,
        },
        {
            url: `${baseUrl}/incidents`,
            lastModified: currentDate,
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/maintenances`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];
}
