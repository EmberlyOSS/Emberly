'use client';

import { clsx } from 'clsx';
import * as React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Array<{ value: string; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, label, options, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && <label className="block mb-2 text-xs text-[#78716c]">{label}</label>}
            <select
                ref={ref}
                className={clsx(
                    'w-full px-3 py-2.5 text-sm text-white border rounded-lg bg-[#1c1917] border-white/[0.08] focus:outline-none focus:border-white/[0.2] transition-colors',
                    className
                )}
                {...props}
            >
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
});

Select.displayName = 'Select';

export { Select };
