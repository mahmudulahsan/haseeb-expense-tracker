import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currency: string): string {
  if (!currency) return "$";

  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    });

    // Extract the symbol from the formatted parts
    const parts = formatter.formatToParts(1);
    const symbol = parts.find(part => part.type === "currency")?.value;

    return symbol || currency;
  } catch (error) {
    // Fallback if currency code is invalid
    return currency;
  }
}
