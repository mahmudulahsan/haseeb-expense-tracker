"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { savingsGoalSchema, SavingsGoal } from "@/lib/validations/savings";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * Gets the savings data from the user's profile.
 * We store this as an encrypted JSON string in the 'savings_data' column.
 */
export async function getSavingsData() {
    const session = await getSession();
    if (!session) return { goals: [] };

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("savings_data")
        .eq("id", session.user.id)
        .single();

    if (error || !data?.savings_data) {
        return { goals: [] };
    }

    try {
        let rawData = data.savings_data;
        let decrypted: string = "";

        if (typeof rawData === 'object' && 'encrypted' in rawData) {
            decrypted = decrypt(rawData.encrypted);
        } else if (typeof rawData === 'string') {
            decrypted = decrypt(rawData);
        } else {
            return { goals: [] };
        }

        const parsed = JSON.parse(decrypted);
        return parsed || { goals: [] };
    } catch (e) {
        console.error("Failed to parse savings data:", e);
        return { goals: [] };
    }
}

export async function createSavingsGoal(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        target_amount: formData.get("target_amount"),
        current_amount: formData.get("current_amount") || 0,
        icon: formData.get("icon") || "PiggyBank",
        color: formData.get("color") || "#ec4899",
    };

    const validated = savingsGoalSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: "Invalid fields", details: validated.error.flatten().fieldErrors };
    }

    const currentSavings = await getSavingsData();
    const newGoal: SavingsGoal = {
        id: crypto.randomUUID(),
        ...validated.data,
        created_at: new Date().toISOString()
    };

    currentSavings.goals.push(newGoal);

    const supabase = createAdminClient();
    const encryptedData = {
        encrypted: encrypt(JSON.stringify(currentSavings))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            savings_data: encryptedData,
            updated_at: new Date().toISOString()
        })
        .eq("id", session.user.id);

    if (error) {
        console.error("DB Error creating savings goal:", error);
        return { error: `Failed to create goal: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true, goal: newGoal };
}

export async function addSavingsProgress(goalId: string, amount: number) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const currentSavings = await getSavingsData();
    const goalIndex = currentSavings.goals.findIndex((g: SavingsGoal) => g.id === goalId);

    if (goalIndex === -1) {
        return { error: "Goal not found" };
    }

    currentSavings.goals[goalIndex].current_amount += amount;

    const supabase = createAdminClient();
    const encryptedData = {
        encrypted: encrypt(JSON.stringify(currentSavings))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            savings_data: encryptedData,
            updated_at: new Date().toISOString()
        })
        .eq("id", session.user.id);

    if (error) {
        return { error: `Failed to update progress: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}

export async function deleteSavingsGoal(goalId: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const currentSavings = await getSavingsData();
    currentSavings.goals = currentSavings.goals.filter((g: SavingsGoal) => g.id !== goalId);

    const supabase = createAdminClient();
    const encryptedData = {
        encrypted: encrypt(JSON.stringify(currentSavings))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            savings_data: encryptedData,
            updated_at: new Date().toISOString()
        })
        .eq("id", session.user.id);

    if (error) {
        return { error: "Failed to delete goal" };
    }

    revalidatePath("/");
    return { success: true };
}
