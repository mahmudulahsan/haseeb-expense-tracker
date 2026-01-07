import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currency: string): string {
  if (!currency) return "$";

  const symbols: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
    AUD: "$",
    CAD: "$",
    CNY: "¥",
    PKR: "₨",
  };

  if (symbols[currency]) {
    return symbols[currency];
  }

  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: "narrowSymbol",
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
