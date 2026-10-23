'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { clsx } from 'clsx';
import * as React from 'react';

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitive.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Viewport
        ref={ref}
        className={clsx(
            'fixed bottom-0 right-0 z-50 flex flex-col p-4 gap-2 w-full md:max-w-[420px] max-h-screen',
            className
        )}
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Root
        ref={ref}
        className={clsx(
            'p-4 rounded-lg border border-white/[0.12] bg-[#292524] text-white shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[swipe=end]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
            'data-[state=open]:slide-in-from-right-full data-[state=closed]:fade-out',
            className
        )}
        {...props}
    />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Title ref={ref} className={clsx('text-sm font-semibold text-white', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Description ref={ref} className={clsx('text-xs text-[#a8a29e] mt-1', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitive.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Action
        ref={ref}
        className={clsx(
            'inline-flex items-center justify-center px-3 py-1 text-sm font-medium transition-colors rounded-md',
            'bg-white/[0.08] hover:bg-white/[0.12] text-white',
            className
        )}
        {...props}
    />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitive.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitive.Close
        ref={ref}
        className={clsx(
            'absolute top-2 right-2 p-1 rounded-md text-[#78716c] hover:text-white hover:bg-white/[0.08]',
            className
        )}
        toast-close=""
        {...props}
    />
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose };
