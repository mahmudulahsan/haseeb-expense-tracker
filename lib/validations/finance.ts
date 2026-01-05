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
    category_id: z.string().uuid("Invalid category").optional(),
    account_id: z.string().uuid("Invalid account"),
    to_account_id: z.string().uuid("Invalid destination account").optional(),
    type: z.enum(["income", "expense", "transfer"]),
    description: z.string().max(1000).optional().or(z.literal("")),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format").optional(),
}).refine(data => {
    if (data.type === "transfer") {
        return !!data.to_account_id && data.to_account_id !== data.account_id;
    }
    return !!data.category_id;
}, {
    message: "Destination account is required for transfers and must be different from source account. Category is required for income/expense.",
    path: ["to_account_id"]
});

export type TransactionSchema = z.infer<typeof transactionSchema>;
