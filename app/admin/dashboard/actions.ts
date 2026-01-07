"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function getUserTransactions(userId: string) {
    const cookieStore = await cookies();
    if (!cookieStore.has("admin_session")) {
        return { error: "Unauthorized" };
    }

    const supabase = createAdminClient();

    // Now fetching amount as well since we can decrypt it
    const { data: transactions, error } = await supabase
        .from("expenses")
        .select("id, date, time, type, created_at, amount")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

    if (error) {
        console.error("Error fetching user transactions:", error);
        return { error: "Failed to fetch transactions" };
    }

    // Decrypt amounts before returning
    // We do NOT return descriptions as they might contain personal info the admin shouldn't necessarily see lightly, 
    // but technically we could. For now, let's keep it to metadata + amount.
    const decryptedTransactions = transactions.map(tx => ({
        ...tx,
        amount: tx.amount ? Number(decrypt(tx.amount)) : 0
    }));

    return { success: true, transactions: decryptedTransactions };
}

export async function deleteUserTransaction(transactionId: string, userId: string) {
    const cookieStore = await cookies();
    if (!cookieStore.has("admin_session")) {
        return { error: "Unauthorized" };
    }

    const supabase = createAdminClient();

    // 1. Get transaction details to adjust balance
    const { data: tx, error: fetchError } = await supabase
        .from("expenses")
        .select("amount, type, account_id, to_account_id")
        .eq("id", transactionId)
        .eq("user_id", userId)
        .single();

    if (fetchError || !tx) return { error: "Transaction not found" };

    // 2. Delete transaction (admin override)
    const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", transactionId)
        // Ensure strictly matching user_id to avoid accidents
        .eq("user_id", userId);

    if (deleteError) {
        console.error("Delete transaction error:", deleteError);
        return { error: "Failed to delete transaction" };
    }

    // 3. Revert balance (using server key decryption)
    // Note: This logic mirrors the user's deleteTransaction action
    const amount = Number(decrypt(tx.amount));

    if (tx.type === "transfer") {
        // Revert source (increment back)
        if (tx.account_id) {
            const { data: srcAcc } = await supabase.from("accounts").select("balance").eq("id", tx.account_id).single();
            if (srcAcc) {
                await supabase.from("accounts").update({ balance: srcAcc.balance + amount }).eq("id", tx.account_id);
            }
        }
        // Revert destination (decrement back)
        if ((tx as any).to_account_id) {
            const { data: destAcc } = await supabase.from("accounts").select("balance").eq("id", (tx as any).to_account_id).single();
            if (destAcc) {
                await supabase.from("accounts").update({ balance: destAcc.balance - amount }).eq("id", (tx as any).to_account_id);
            }
        }
    } else if (tx.account_id) {
        const { data: account } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", tx.account_id)
            .single();

        if (account) {
            const newBalance = tx.type === "income"
                ? Number(account.balance) - amount
                : Number(account.balance) + amount;

            await supabase
                .from("accounts")
                .update({ balance: newBalance })
                .eq("id", tx.account_id);
        }
    }

    revalidatePath("/admin/dashboard");
    return { success: true };
}

export async function deleteUserTransactionsBulk(transactionIds: string[], userId: string) {
    const cookieStore = await cookies();
    if (!cookieStore.has("admin_session")) {
        return { error: "Unauthorized" };
    }

    if (!transactionIds || transactionIds.length === 0) {
        return { success: true };
    }

    const supabase = createAdminClient();

    // 1. Get all transactions to adjust balances
    const { data: transactions, error: fetchError } = await supabase
        .from("expenses")
        .select("id, amount, type, account_id, to_account_id")
        .in("id", transactionIds)
        .eq("user_id", userId);

    if (fetchError || !transactions) return { error: "Transactions not found" };

    // 2. Delete transactions
    const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .in("id", transactionIds)
        .eq("user_id", userId);

    if (deleteError) {
        console.error("Delete transactions error:", deleteError);
        return { error: "Failed to delete transactions" };
    }

    // 3. Group by account to minimize updates
    const balanceAdjustments: Record<string, number> = {};
    for (const tx of transactions) {
        const amount = Number(decrypt(tx.amount));
        if (tx.type === "transfer") {
            if (tx.account_id) {
                balanceAdjustments[tx.account_id] = (balanceAdjustments[tx.account_id] || 0) + amount;
            }
            if ((tx as any).to_account_id) {
                balanceAdjustments[(tx as any).to_account_id] = (balanceAdjustments[(tx as any).to_account_id] || 0) - amount;
            }
        } else if (tx.account_id) {
            const adjustment = tx.type === "income" ? -amount : amount;
            balanceAdjustments[tx.account_id] = (balanceAdjustments[tx.account_id] || 0) + adjustment;
        }
    }

    // 4. Update balances
    for (const [accountId, adjustment] of Object.entries(balanceAdjustments)) {
        const { data: account } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", accountId)
            .single();

        if (account) {
            await supabase
                .from("accounts")
                .update({ balance: Number(account.balance) + adjustment })
                .eq("id", accountId);
        }
    }

    revalidatePath("/admin/dashboard");
    return { success: true };
}
