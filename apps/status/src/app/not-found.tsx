import Link from 'next/link';

const links = [
    { label: 'Home', href: '/' },
    { label: 'Incidents', href: '/incidents' },
    { label: 'Maintenances', href: '/maintenances' },
    { label: 'Support', href: 'https://discord.gg/36spBmzZVB' },
];

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
            <div className="w-full max-w-sm text-center">
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 mb-4">Error 404</p>
                <h1 className="text-3xl font-semibold text-white mb-3">Page not found</h1>
                <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                    The page you are looking for does not exist, has been moved, or is temporarily unavailable.
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-4 py-2 text-sm border border-white/[0.08] text-zinc-400 rounded-lg hover:border-white/[0.2] hover:text-white transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <Link
                    href="/"
                    className="inline-block px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
