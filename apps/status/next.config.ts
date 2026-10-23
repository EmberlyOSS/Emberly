import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },

    // Exclude large server-only packages from the client bundle
    serverExternalPackages: ['nodemailer', '@prisma/client', 'bcrypt'],

    // Compress responses
    compress: true,
};

export default nextConfig;
