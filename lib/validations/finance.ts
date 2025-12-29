import { z } from "zod";

export const accountSchema = z.object({
    name: z.string().min(1, "Account name is required").max(50),
    type: z.enum(["Current", "Savings", "Investment", "Wallet"]),
    balance: z.coerce.number().min(0, "Initial balance cannot be negative"),
    color: z.string().optional().default("bg-primary"),
    icon: z.string().optional().default("Wallet"),
});

export type AccountSchema = z.infer<typeof accountSchema>;

export const transactionSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    category_id: z.string().uuid("Invalid category"),
    account_id: z.string().uuid("Invalid account"),
    type: z.enum(["income", "expense"]),
    description: z.string().max(1000).optional().or(z.literal("")),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type TransactionSchema = z.infer<typeof transactionSchema>;
