import { renderEmailTemplate } from './server-rendering';
import type { EmailTemplateProps, TemplateName } from './template';

/**
 * Renders an email template to static HTML markup
 *
 * @description
 * This function should only be called from a server context (API route or Server Action).
 * It creates a React element for the specified email template and renders it to static HTML.
 *
 * @template T - The email template name (must be a valid TemplateName)
 * @param {T} templateName - The name of the email template to render
 * @param {EmailTemplateProps[T]} props - The props to pass to the email template component
 * @returns {string} - HTML string of the rendered email template
 * @throws {Error} - Throws if the template name doesn't match any available templates
 *
 * @example
 * // Render a welcome email to HTML in an API route
 * const html = renderEmailToHtml('welcome', { name: 'John Doe' });
 *
 * @example
 * // Render a password reset email to HTML in a server action
 * const html = renderEmailToHtml('passwordReset', {
 *   resetLink: 'https://example.com/reset'
 * });
 */
export function renderEmailToHtml<T extends TemplateName>(templateName: T, props: EmailTemplateProps[T]): string {
    // Use the server-side rendering utility
    return renderEmailTemplate(templateName, props);
}
