// Canada Date Utilities
// Centralized date handling for Canada/Eastern timezone (America/Toronto)
// All customer-facing and admin dates use this timezone for consistency

const CANADA_TIMEZONE = 'America/Toronto';
const CANADA_LOCALE = 'en-CA';

/**
 * Get today's date string (YYYY-MM-DD) in Canada/Eastern timezone.
 * Use this for database queries that filter by "today".
 */
export function getTodayCanada() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: CANADA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

/**
 * Format a YYYY-MM-DD date string for display (e.g., "May 21, 2026").
 * Safely parses to avoid UTC offset issues.
 */
export function formatDateCanada(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(CANADA_LOCALE, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format a Date object for short time display (e.g., "2:30 PM").
 */
export function formatTimeCanada(date) {
    return date.toLocaleTimeString(CANADA_LOCALE, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format a Date object for full datetime display (e.g., "May 21, 2026, 2:30 PM").
 */
export function formatDateTimeCanada(date) {
    return date.toLocaleString(CANADA_LOCALE, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get current Canada date components for booking ID generation and similar uses.
 * Returns { day, month, year } as zero-padded strings.
 */
export function getDatePartsCanada() {
    const formatter = new Intl.DateTimeFormat(CANADA_LOCALE, {
        timeZone: CANADA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(new Date());
    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    return {
        day: get('day'),
        month: get('month'),
        year: get('year')
    };
}
