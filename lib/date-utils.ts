/**
 * Formats a Date object or date string into YYYY-MM-DD in the user's local timezone.
 * This is useful for <input type="date"> values.
 */
export function formatLocalDate(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    // If the input is a YYYY-MM-DD string, new Date(string) might be interpreted as UTC.
    // To get the actual local date part of a Date object:
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Parses a date string and returns a Date object that respects the local timezone
 * even if the string is in YYYY-MM-DD format (which often defaults to UTC).
 */
export function parseLocalDate(dateStr: string): Date {
    // If it's already a full ISO string, new Date() is fine.
    // If it's YYYY-MM-DD, we should parse it manually to avoid UTC shift.
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return new Date(dateStr);
}

/**
 * Returns the current greeting based on the user's local time.
 */
export function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}
