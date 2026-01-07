import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { decrypt, decryptNumber } from "@/lib/crypto";

export async function getExpenses() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("expenses")
        .select(`
      *,
      categories (
        name,
        icon,
        color
      )
    `)
        .eq("user_id", session.user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching expenses:", error);
        throw new Error("Failed to fetch expenses");
    }

    // Decrypt sensitive fields
    return data.map((expense: any) => ({
        ...expense,
        description: expense.description ? decrypt(expense.description) : expense.description,
        amount: decryptNumber(expense.amount)
    }));
}

export async function getCategories() {
    const session = await getSession();
    if (!session) return [];

    const supabase = createAdminClient();

    // Fetch public categories (user_id is null) AND user-specific categories
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${session.user.id}`)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return data;
}
