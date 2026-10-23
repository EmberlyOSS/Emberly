import type { ReactElement } from 'react';
import { createEmailElement, type EmailTemplateProps, type TemplateName } from './template';

/**
 * Server-side utility to render React elements to HTML strings
 *
 * @description
 * This is a server-only utility that should be used in server components or server actions.
 */

/**
 * Renders a React element to an HTML string
 *
 * @param {ReactElement} element - The React element to render
 * @returns {string} - The resulting HTML string
 */
export function renderToHtml(element: ReactElement): string {
    // Using Next.js internal ReactDOM server renderer to avoid direct imports
    // This approach works in Server Components and API Routes
    // ts-expect-error - Using internal Next.js API
    const renderer = require('next/dist/compiled/react-dom/server');
    return renderer.renderToStaticMarkup(element);
}

/**
 * Renders an email template to HTML using server components
 *
 * @template T - The email template name
 * @param {T} templateName - The name of the email template to render
 * @param {EmailTemplateProps[T]} props - The props for the template
 * @returns {string} - The rendered HTML string
 */
export function renderEmailTemplate<T extends TemplateName>(templateName: T, props: EmailTemplateProps[T]): string {
    const element = createEmailElement(templateName, props);
    return renderToHtml(element);
}
