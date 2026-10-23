/**
 * Date formatting utilities
 */

/**
 * Format a date into a friendly format
 * @param date Date string or object
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    };

    return dateObj.toLocaleDateString('en-GB', options || defaultOptions);
}

/**
 * Format a time into a friendly format
 * @param date Date string or object
 * @param options Formatting options
 * @returns Formatted time string
 */
export function formatTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };

    return dateObj.toLocaleTimeString('en-GB', options || defaultOptions).toUpperCase();
}

/**
 * Get relative time (e.g., "Today", "Tomorrow", "In 3 days")
 * @param date Date string or object
 * @returns Relative time string
 */
export function getRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();

    // Reset time components for date comparison
    const dateObjDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate difference in days
    const diffDays = Math.round((dateObjDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;

    return formatDate(dateObj, {
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Check if a date is in the past
 * @param date Date string or object
 * @returns boolean
 */
export function isPastDate(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
}

/**
 * Format a Discord event date in a user-friendly way
 * @param startDate Start date of the event
 * @param endDate Optional end date of the event
 * @returns Formatted date string
 */
export function formatEventDate(startDate: string, endDate?: string | null): string {
    const start = new Date(startDate);

    if (!endDate) {
        return `${getRelativeTime(start)}, ${formatDate(start)}`;
    }

    const end = new Date(endDate);

    // If start and end are on the same day
    if (start.toDateString() === end.toDateString()) {
        return `${getRelativeTime(start)}, ${formatDate(start)}`;
    }

    // If different days
    return `${formatDate(start)} - ${formatDate(end)}`;
}
