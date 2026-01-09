import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { decrypt, decryptNumber } from "@/lib/crypto";

import { unstable_cache } from "next/cache";

export async function getAccounts() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    return unstable_cache(
        async () => {
            const supabase = createAdminClient();

            const { data, error } = await supabase
                .from("accounts")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching accounts:", error);
                throw new Error("Failed to fetch accounts");
            }

            return data;
        },
        [`accounts-${session.user.id}`],
        {
            tags: [`accounts-${session.user.id}`],
            revalidate: 3600
        }
    )();
}

export async function getAccountTransactions(accountId: string) {
    return unstable_cache(
        async () => {
            const supabase = createAdminClient();

            const { data, error } = await supabase
                .from("expenses")
                .select(`
            *,
            categories (name, icon, color)
        `)
                .eq("account_id", accountId)
                .order("date", { ascending: false });

            if (error) {
                console.error("Error fetching account transactions:", error);
                throw new Error("Failed to fetch transactions");
            }

            // Decrypt sensitive fields
            return data.map((expense: any) => ({
                ...expense,
                description: expense.description ? decrypt(expense.description) : expense.description,
                amount: decryptNumber(expense.amount)
            }));
        },
        [`account-transactions-${accountId}`],
        {
            tags: [`account-transactions-${accountId}`],
            revalidate: 3600
        }
    )();
}
