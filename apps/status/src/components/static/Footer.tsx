import Link from 'next/link';
import { FaDiscord, FaGithub, FaGlobe, FaTwitter } from 'react-icons/fa';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { companyInfo, copyrightInfo, footerNavigation } from '@/constants/navigation';

const socials = [
    { name: 'GitHub', href: companyInfo.contact.socialMedia.github, icon: FaGithub },
    { name: 'Discord', href: companyInfo.contact.socialMedia.discord, icon: FaDiscord },
    { name: 'Twitter', href: companyInfo.contact.socialMedia.twitter, icon: FaTwitter },
    { name: 'Website', href: companyInfo.contact.socialMedia.website, icon: FaGlobe },
];

export default function Footer() {
    return (
        <footer className="mt-auto px-4 pb-6 pt-10">
            <div className="glass-card mx-auto max-w-5xl px-6 py-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <Link href="/" className="inline-flex shrink-0 items-center gap-2.5">
                        <BrandLogo size={20} />
                        <span className="text-sm font-medium text-white">Emberly Status</span>
                    </Link>

                    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
                        {footerNavigation.links.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="text-sm text-zinc-400 transition-colors hover:text-white"
                            >
                                {item.name}
                            </Link>
                        ))}
                        <a
                            href={companyInfo.contact.socialMedia.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            embrly.ca
                        </a>
                    </nav>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-zinc-500">{copyrightInfo.text}</p>
                    <div className="flex items-center gap-4">
                        {socials.map((s) => (
                            <a
                                key={s.name}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.name}
                                className="text-zinc-500 transition-colors hover:text-white"
                            >
                                <s.icon size={16} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
