import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import * as React from 'react';

const buttonVariants = cva(
    'relative inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
    {
        variants: {
            variant: {
                default:
                    'bg-[#F97316] font-semibold text-[#140b05] hover:bg-[#EA580C]',
                destructive:
                    'bg-red-600 text-white hover:bg-red-700',
                outline:
                    'border border-white/[0.15] bg-transparent text-white hover:bg-white/[0.06]',
                secondary:
                    'bg-white/[0.08] text-white border border-white/[0.08] hover:bg-white/[0.12]',
                ghost: 'text-[#a8a29e] hover:text-white hover:bg-white/[0.06]',
                link: 'text-white underline-offset-4 hover:underline',
                glow: 'bg-[#F97316] font-semibold text-[#140b05] hover:bg-[#EA580C]',
                accent: 'bg-[#F97316] font-semibold text-[#140b05] hover:bg-[#EA580C]',
                success:
                    'bg-emerald-600 text-white hover:bg-emerald-700',
            },
            size: {
                default: 'h-10 py-2 px-4',
                sm: 'h-8 px-3 text-xs rounded-md',
                lg: 'h-11 px-6 text-base',
                xl: 'h-12 px-8 text-base',
                icon: 'h-9 w-9 rounded-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, children, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp className={clsx(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
                {(variant === 'default' ||
                    variant === 'glow' ||
                    variant === 'accent' ||
                    variant === 'success' ||
                    variant === 'destructive') && (
                    <span className="absolute inset-0 overflow-hidden rounded-xl">
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent hover:animate-shimmer" />
                    </span>
                )}
                <span className="relative z-10 flex items-center gap-2">{children}</span>
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
