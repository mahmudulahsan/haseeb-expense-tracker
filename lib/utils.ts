import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function getCurrencySymbol(currencyCode: string = 'USD') {
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        INR: '₹',
        AUD: '$',
        CAD: '$',
        CNY: '¥',
        PKR: 'Rs',
        BDT: '৳',
    };
    return symbols[currencyCode] || '$';
}
