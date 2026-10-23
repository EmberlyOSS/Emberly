'use client';

import * as FormPrimitive from '@radix-ui/react-form';
import { clsx } from 'clsx';
import * as React from 'react';

const Form = FormPrimitive.Root;

const FormField = FormPrimitive.Field;

const FormLabel = React.forwardRef<
    React.ElementRef<typeof FormPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof FormPrimitive.Label>
>(({ className, ...props }, ref) => (
    <FormPrimitive.Label ref={ref} className={clsx('text-sm font-medium text-[#a8a29e]', className)} {...props} />
));
FormLabel.displayName = FormPrimitive.Label.displayName;

const FormControl = FormPrimitive.Control;

const FormMessage = React.forwardRef<
    React.ElementRef<typeof FormPrimitive.Message>,
    React.ComponentPropsWithoutRef<typeof FormPrimitive.Message>
>(({ className, ...props }, ref) => (
    <FormPrimitive.Message ref={ref} className={clsx('text-xs text-red-400', className)} {...props} />
));
FormMessage.displayName = FormPrimitive.Message.displayName;

const FormInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            ref={ref}
            autoComplete="off"
            className={clsx(
                'w-full px-3 py-2 text-white placeholder:text-[#57534e] border rounded-lg bg-[#1c1917] border-white/[0.1] focus:outline-none focus:border-white/[0.3]',
                className
            )}
            {...props}
        />
    )
);
FormInput.displayName = 'FormInput';

const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={clsx(
                'w-full px-3 py-2 text-white placeholder:text-[#57534e] border rounded-lg bg-[#1c1917] border-white/[0.1] focus:outline-none focus:border-white/[0.3] resize-none',
                className
            )}
            {...props}
        />
    )
);
FormTextarea.displayName = 'FormTextarea';

export { Form, FormField, FormLabel, FormControl, FormMessage, FormInput, FormTextarea };
