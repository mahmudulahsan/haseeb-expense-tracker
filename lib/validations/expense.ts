import { z } from "zod";

export const expenseSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    category_id: z.string().uuid("Invalid category"),
    description: z.string().min(1, "Description is required").max(255),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;
