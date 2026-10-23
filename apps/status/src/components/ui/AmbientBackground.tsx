/**
 * Fixed backdrop matching the main Emberly site: warm near-black with soft
 * ember glows. Purely decorative and behind all content.
 */
export default function AmbientBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(249,115,22,0.16),transparent_70%)]" />
            <div className="absolute -left-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(194,65,12,0.12),transparent_70%)] blur-3xl" />
            <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.07),transparent_70%)] blur-3xl" />
        </div>
    );
}
