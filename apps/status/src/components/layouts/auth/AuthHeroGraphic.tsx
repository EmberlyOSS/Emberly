import { useEffect, useState } from 'react';

export default function AuthHeroGraphic({ className = '' }: { className?: string }) {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(mq.matches);
        onChange();
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, []);

    // If reduced motion is requested, render a simpler static composition
    if (reduced) {
        return (
            <svg
                className={className}
                viewBox="0 0 800 480"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Emberly hero graphic"
            >
                <rect width="100%" height="100%" rx="12" fill="#120c09" />
                <g transform="translate(80,60)">
                    <circle cx="520" cy="120" r="110" fill="#F97316" opacity="0.08" />
                    <circle cx="420" cy="80" r="80" fill="#C2410C" opacity="0.06" />
                </g>
                <text x="10" y="430" fill="#9ca3af" fontSize="12">
                    Emberly
                </text>
            </svg>
        );
    }

    return (
        <svg
            className={className}
            viewBox="0 0 800 480"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Emberly animated hero graphic"
        >
            <defs>
                <linearGradient id="bg" x1="0" x2="1">
                    <stop offset="0%" stopColor="#120c09" />
                    <stop offset="100%" stopColor="#081630" />
                </linearGradient>
                <radialGradient id="glowA" cx="50%" cy="30%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#C2410C" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#120c09" stopOpacity="0" />
                </radialGradient>
                <filter id="f1" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="20" result="b" />
                    <feBlend in="SourceGraphic" in2="b" />
                </filter>
            </defs>

            <rect width="100%" height="100%" rx="12" fill="url(#bg)" />

            {/* animated background blobs */}
            <g>
                <g>
                    <circle cx="600" cy="140" r="140" fill="url(#glowA)" filter="url(#f1)">
                        <animate attributeName="cx" values="600;640;600" dur="10s" repeatCount="indefinite" />
                        <animate attributeName="cy" values="140;160;140" dur="12s" repeatCount="indefinite" />
                    </circle>
                </g>
                <g>
                    <circle cx="150" cy="220" r="90" fill="#F97316" opacity="0.08">
                        <animate attributeName="r" values="80;96;80" dur="8s" repeatCount="indefinite" />
                    </circle>
                </g>
            </g>

            {/* central network motif */}
            <g transform="translate(350,240)">
                <g>
                    <circle r="6" fill="#ffffff">
                        <animate attributeName="r" values="6;10;6" dur="2.6s" repeatCount="indefinite" />
                    </circle>
                </g>
                {[0, 72, 144, 216, 288].map((angle, i) => (
                    <g key={i} transform={`rotate(${angle})`}>
                        <g>
                            <circle
                                cx="-160"
                                cy="0"
                                r={6 - (i % 3)}
                                fill={['#FB923C', '#FBBF24', '#34d399'][i % 3]}
                                opacity="0.95"
                            >
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from={`0 160 0`}
                                    to={`360 160 0`}
                                    dur={`${10 + i * 2}s`}
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </g>
                    </g>
                ))}
            </g>

            {/* subtle grid */}
            <g opacity="0.04" stroke="#ffffff">
                {[...Array(6)].map((_, i) => (
                    <line key={i} x1={40} y1={60 + i * 60} x2={760} y2={60 + i * 60} strokeWidth="1" />
                ))}
            </g>

            {/* brand mark */}
            <g transform="translate(40,370)">
                <rect width="120" height="36" rx="6" fill="#0b1220" opacity="0.6" />
                <text x="12" y="23" fill="#9ca3af" fontSize="14" fontFamily="sans-serif">
                    Emberly
                </text>
            </g>
        </svg>
    );
}
