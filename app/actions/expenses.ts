"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { expenseSchema } from "@/lib/validations/expense";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createExpense(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();
    const user = session.user;

    // 2. Validation
    const rawData = {
        amount: formData.get("amount"),
        category_id: formData.get("category_id"),
        description: formData.get("description"),
        date: formData.get("date"),
    };

    const validatedFields = expenseSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields",
            details: validatedFields.error.flatten().fieldErrors
        };
    }

    // 3. Database operation
    const { error } = await supabase.from("expenses").insert({
        ...validatedFields.data,
        user_id: user.id,
    });

    if (error) {
        console.error("Database error:", error);
        return { error: "Failed to create expense" };
    }

    // 4. Update UI
    revalidateTag(`expenses-${session.user.id}`);
    revalidatePath("/", "layout");
    return { success: true };
}
