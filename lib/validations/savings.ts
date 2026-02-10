import { z } from "zod";

export const savingsGoalSchema = z.object({
    name: z.string().min(1, "Goal name is required").max(100),
    target_amount: z.coerce.number().positive("Target amount must be positive"),
    current_amount: z.coerce.number().min(0).default(0),
    icon: z.string().optional().default("PiggyBank"),
    color: z.string().optional().default("#ec4899"),
});

export type SavingsGoal = z.infer<typeof savingsGoalSchema> & { id: string; created_at?: string };

export const addSavingsProgressSchema = z.object({
    goal_id: z.string().uuid(),
    amount: z.coerce.number().positive("Amount must be positive"),
});
