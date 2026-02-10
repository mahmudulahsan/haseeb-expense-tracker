"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, logout } from "@/lib/auth";
import { accountSchema, transactionSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseTransactionWithAI, getSmartInsights } from "@/services/ai";
import { encrypt, decrypt, decryptNumber } from "@/lib/crypto";


export async function createAccount(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const rawData = {
        name: formData.get("name"),
        type: formData.get("type"),
        balance: formData.get("balance"),
        color: formData.get("color") || undefined,
        icon: formData.get("icon") || undefined,
    };

    const validatedFields = accountSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten().fieldErrors };
    }

    const { data, error } = await supabase.from("accounts").insert({
        ...validatedFields.data,
        user_id: session.user.id,
    }).select().single();

    if (error) {
        console.error("Database error:", error);
        return { error: `Failed to create account: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true, account: data };
}

export async function updateAccount(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const rawData = {
        name: formData.get("name"),
        type: formData.get("type"),
        balance: formData.get("balance"),
        color: formData.get("color") || undefined,
        icon: formData.get("icon") || undefined,
    };

    const validatedFields = accountSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten().fieldErrors };
    }

    const { data, error } = await supabase
        .from("accounts")
        .update({
            ...validatedFields.data,
        })
        .eq("id", id)
        .eq("user_id", session.user.id)
        .select()
        .single();

    if (error) {
        console.error("Database error:", error);
        return { error: `Failed to update account: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true, account: data };
}

export async function createTransaction(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const rawData = {
        amount: formData.get("amount"),
        category_id: formData.get("category_id"),
        account_id: formData.get("account_id"),
        type: formData.get("type"),
        description: formData.get("description"),
        to_account_id: formData.get("to_account_id"),
        date: formData.get("date"),
        time: formData.get("time"),
        necessity_level: formData.get("necessity_level"),
    };

    // Filter nulls to undefined for Zod
    const sanitizedData = Object.fromEntries(
        Object.entries(rawData).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const validatedFields = transactionSchema.safeParse(sanitizedData);

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten().fieldErrors };
    }

    const transaction = validatedFields.data;
    const originalAmount = transaction.amount;

    // Encrypt sensitive fields
    if (transaction.description) {
        transaction.description = encrypt(transaction.description);
    }
    // Encrypt amount for DB storage (cast to any to bypass type check for insertion)
    (transaction as any).amount = encrypt(originalAmount);

    // 1. Get current account balance
    const { data: account, error: accFetchError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", transaction.account_id)
        .single();

    if (accFetchError || !account) {
        return { error: "Account not found" };
    }

    // 2. Insert transaction
    const { data: resultInsert, error: txError } = await supabase.from("expenses").insert({
        ...transaction,
        user_id: session.user.id,
    }).select('id');

    if (txError) {
        console.error("Tx Database error:", txError);
        return { error: `Failed to record transaction: ${txError.message}` };
    }

    // 4. Update balance
    if (transaction.type === "transfer") {
        // Decrement source
        await supabase
            .from("accounts")
            .update({ balance: account.balance - originalAmount })
            .eq("id", transaction.account_id);

        // Increment destination
        if (transaction.to_account_id) {
            const { data: toAccount } = await supabase
                .from("accounts")
                .select("balance")
                .eq("id", transaction.to_account_id)
                .single();

            if (toAccount) {
                await supabase
                    .from("accounts")
                    .update({ balance: toAccount.balance + originalAmount })
                    .eq("id", transaction.to_account_id);
            }
        }
    } else {
        const newBalance = transaction.type === "income"
            ? account.balance + originalAmount
            : account.balance - originalAmount;

        const { error: updateError } = await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", transaction.account_id);

        if (updateError) {
            console.error("Balance update error:", updateError);
        }
    }

    // 5. Sync with Lent/Liabilities if applicable
    if (transaction.category_id) {
        const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", transaction.category_id)
            .single();

        if (category) {
            const catName = category.name.toLowerCase();
            if (catName === 'lent' || catName === 'liabilities' || catName === 'lend' || catName === 'borrow') {
                const isLent = catName === 'lent' || catName === 'lend';
                const field = isLent ? "lent_data" : "liabilities_data";

                const { data: profile } = await supabase
                    .from("profiles")
                    .select(field)
                    .eq("id", session.user.id)
                    .single();

                if (profile) {
                    let rawData = (profile as any)[field];
                    let currentData: any = { [isLent ? "lent" : "liabilities"]: [], calculate: false };

                    if (rawData && typeof rawData === 'object' && 'encrypted' in rawData) {
                        currentData = JSON.parse(decrypt(rawData.encrypted));
                    } else if (rawData) {
                        currentData = rawData;
                    }

                    const list = isLent ? currentData.lent : currentData.liabilities;
                    list.push({
                        id: crypto.randomUUID(),
                        [isLent ? "person" : "source"]: transaction.description ? decrypt(transaction.description) : "Untitled",
                        amount: originalAmount.toString(),
                        linked_tx_id: resultInsert?.[0]?.id
                    });

                    await supabase
                        .from("profiles")
                        .update({
                            [field]: { encrypted: encrypt(JSON.stringify(currentData)) },
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", session.user.id);
                }
            }
        }
    }

    revalidatePath("/");
    return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const rawData = {
        amount: formData.get("amount"),
        category_id: formData.get("category_id"),
        account_id: formData.get("account_id"),
        type: formData.get("type"),
        description: formData.get("description"),
        to_account_id: formData.get("to_account_id"),
        date: formData.get("date"),
        time: formData.get("time"),
        necessity_level: formData.get("necessity_level"),
    };

    const sanitizedData = Object.fromEntries(
        Object.entries(rawData).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const validatedFields = transactionSchema.safeParse(sanitizedData);

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten().fieldErrors };
    }

    const updatedData = { ...validatedFields.data };
    const newAmount = updatedData.amount;

    // 1. Fetch old transaction to revert balance
    const { data: oldTx, error: fetchTxError } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

    if (fetchTxError || !oldTx) {
        return { error: "Transaction not found" };
    }

    const oldAmountValue = Number(decrypt(oldTx.amount));

    // 2. Revert balance on the OLD account(s)
    if (oldTx.type === "transfer") {
        // Revert source (increment back)
        const { data: srcAcc } = await supabase.from("accounts").select("balance").eq("id", oldTx.account_id).single();
        if (srcAcc) {
            await supabase.from("accounts").update({ balance: srcAcc.balance + oldAmountValue }).eq("id", oldTx.account_id);
        }
        // Revert destination (decrement back)
        if (oldTx.to_account_id) {
            const { data: destAcc } = await supabase.from("accounts").select("balance").eq("id", oldTx.to_account_id).single();
            if (destAcc) {
                await supabase.from("accounts").update({ balance: destAcc.balance - oldAmountValue }).eq("id", oldTx.to_account_id);
            }
        }
    } else {
        const { data: oldAccount, error: oldAccError } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", oldTx.account_id)
            .single();

        if (!oldAccError && oldAccount) {
            const revertedBalance = oldTx.type === "income"
                ? oldAccount.balance - oldAmountValue
                : oldAccount.balance + oldAmountValue;

            await supabase
                .from("accounts")
                .update({ balance: revertedBalance })
                .eq("id", oldTx.account_id);
        }
    }

    // 3. Encrypt relevant fields for update
    if (updatedData.description) {
        updatedData.description = encrypt(updatedData.description);
    }
    // Encrypt amount for DB storage
    (updatedData as any).amount = encrypt(newAmount);

    // 4. Update the transaction
    const { error: updateTxError } = await supabase
        .from("expenses")
        .update({ ...updatedData })
        .eq("id", id)
        .eq("user_id", session.user.id);

    if (updateTxError) {
        console.error("Update Tx error:", updateTxError);
        return { error: `Failed to update transaction: ${updateTxError.message}` };
    }

    // 5. Apply balance to the NEW (potentially same) account(s)
    if (updatedData.type === "transfer") {
        // Apply source (decrement)
        const { data: srcAcc } = await supabase.from("accounts").select("balance").eq("id", updatedData.account_id).single();
        if (srcAcc) {
            await supabase.from("accounts").update({ balance: srcAcc.balance - newAmount }).eq("id", updatedData.account_id);
        }
        // Apply destination (increment)
        if (updatedData.to_account_id) {
            const { data: destAcc } = await supabase.from("accounts").select("balance").eq("id", updatedData.to_account_id).single();
            if (destAcc) {
                await supabase.from("accounts").update({ balance: destAcc.balance + newAmount }).eq("id", updatedData.to_account_id);
            }
        }
    } else {
        const { data: newAccount, error: newAccError } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", updatedData.account_id)
            .single();

        if (!newAccError && newAccount) {
            const finalBalance = updatedData.type === "income"
                ? newAccount.balance + newAmount
                : newAccount.balance - newAmount;

            await supabase
                .from("accounts")
                .update({ balance: finalBalance })
                .eq("id", updatedData.account_id);
        }
    }

    // 6. Sync with Lent/Liabilities if applicable
    const oldCatId = oldTx.category_id;
    const newCatId = updatedData.category_id;

    if (oldCatId || newCatId) {
        // Fetch category names
        const { data: oldCat } = oldCatId ? await supabase.from("categories").select("name").eq("id", oldCatId).single() : { data: null };
        const { data: newCat } = newCatId ? await supabase.from("categories").select("name").eq("id", newCatId).single() : { data: null };

        const oldName = oldCat?.name?.toLowerCase() || "";
        const newName = newCat?.name?.toLowerCase() || "";

        const wasSynced = oldName === 'lent' || oldName === 'liabilities' || oldName === 'lend' || oldName === 'borrow';
        const isSynced = newName === 'lent' || newName === 'liabilities' || newName === 'lend' || newName === 'borrow';

        if (wasSynced || isSynced) {
            const userId = session.user.id;

            // If it was synced and now isn't, or category changed between Lent and Liabilities, remove from old
            if (wasSynced && (oldName !== newName)) {
                const isOldLent = oldName === 'lent' || oldName === 'lend';
                const prevField = isOldLent ? "lent_data" : "liabilities_data";
                const { data: p } = await supabase.from("profiles").select(prevField).eq("id", userId).single();
                if (p) {
                    let d = (p as any)[prevField];
                    let currentData = d && typeof d === 'object' && 'encrypted' in d ? JSON.parse(decrypt(d.encrypted)) : (d || { [isOldLent ? "lent" : "liabilities"]: [], calculate: false });
                    const lk = isOldLent ? "lent" : "liabilities";
                    currentData[lk] = currentData[lk].filter((item: any) => item.linked_tx_id !== id);
                    await supabase.from("profiles").update({ [prevField]: { encrypted: encrypt(JSON.stringify(currentData)) }, updated_at: new Date().toISOString() }).eq("id", userId);
                }
            }

            // If it is synced (new or updated)
            if (isSynced) {
                const isNewLent = newName === 'lent' || newName === 'lend';
                const field = isNewLent ? "lent_data" : "liabilities_data";
                const { data: p } = await supabase.from("profiles").select(field).eq("id", userId).single();
                if (p) {
                    let d = (p as any)[field];
                    let currentData = d && typeof d === 'object' && 'encrypted' in d ? JSON.parse(decrypt(d.encrypted)) : (d || { [isNewLent ? "lent" : "liabilities"]: [], calculate: false });
                    const lk = isNewLent ? "lent" : "liabilities";

                    const existingIndex = currentData[lk].findIndex((item: any) => item.linked_tx_id === id);
                    const entryData = {
                        id: existingIndex >= 0 ? currentData[lk][existingIndex].id : crypto.randomUUID(),
                        [isNewLent ? "person" : "source"]: validatedFields.data.description || "Untitled",
                        amount: newAmount.toString(),
                        linked_tx_id: id
                    };

                    if (existingIndex >= 0) {
                        currentData[lk][existingIndex] = entryData;
                    } else {
                        currentData[lk].push(entryData);
                    }

                    await supabase.from("profiles").update({ [field]: { encrypted: encrypt(JSON.stringify(currentData)) }, updated_at: new Date().toISOString() }).eq("id", userId);
                }
            }
        }
    }

    revalidatePath("/");
    return { success: true };
}

export async function deleteAccount(id: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

    if (error) {
        console.error("Delete account error:", error);
        return { error: "Failed to delete account" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function deleteTransaction(id: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    // 1. Get transaction details to adjust balance
    const { data: tx, error: fetchError } = await supabase
        .from("expenses")
        .select("amount, type, account_id, to_account_id, category_id")
        .eq("id", id)
        .single();

    if (fetchError || !tx) return { error: "Transaction not found" };

    // 4. Sync removal from Lent/Liabilities
    if (tx.category_id) {
        const { data: category } = await supabase.from("categories").select("name").eq("id", tx.category_id).single();
        if (category) {
            const catName = category.name.toLowerCase();
            if (catName === 'lent' || catName === 'liabilities' || catName === 'lend' || catName === 'borrow') {
                const isLent = catName === 'lent' || catName === 'lend';
                const field = isLent ? "lent_data" : "liabilities_data";
                const { data: profile } = await supabase.from("profiles").select(field).eq("id", session.user.id).single();
                if (profile) {
                    let rawData = (profile as any)[field];
                    let currentData = rawData && typeof rawData === 'object' && 'encrypted' in rawData
                        ? JSON.parse(decrypt(rawData.encrypted)) : (rawData || { [isLent ? "lent" : "liabilities"]: [], calculate: false });

                    const listKey = isLent ? "lent" : "liabilities";
                    currentData[listKey] = currentData[listKey].filter((item: any) => item.linked_tx_id !== id);

                    await supabase.from("profiles").update({
                        [field]: { encrypted: encrypt(JSON.stringify(currentData)) },
                        updated_at: new Date().toISOString()
                    }).eq("id", session.user.id);
                }
            }
        }
    }

    // 2. Delete transaction from expenses table
    const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

    if (deleteError) {
        console.error("Delete transaction error:", deleteError);
        return { error: "Failed to delete transaction" };
    }

    // 3. Revert balance on associated account(s)
    const amountOrig = Number(decrypt(tx.amount));
    if (tx.type === "transfer") {
        // Revert source (increment back)
        if (tx.account_id) {
            const { data: srcAcc } = await supabase.from("accounts").select("balance").eq("id", tx.account_id).single();
            if (srcAcc) {
                await supabase.from("accounts").update({ balance: srcAcc.balance + amountOrig }).eq("id", tx.account_id);
            }
        }
        // Revert destination (decrement back)
        if (tx.to_account_id) {
            const { data: destAcc } = await supabase.from("accounts").select("balance").eq("id", tx.to_account_id).single();
            if (destAcc) {
                await supabase.from("accounts").update({ balance: destAcc.balance - amountOrig }).eq("id", tx.to_account_id);
            }
        }
    } else if (tx.account_id) {
        const { data: account } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", tx.account_id)
            .single();

        if (account) {
            const newBalanceValue = tx.type === "income"
                ? Number(account.balance) - amountOrig
                : Number(account.balance) + amountOrig;

            await supabase
                .from("accounts")
                .update({ balance: newBalanceValue })
                .eq("id", tx.account_id);
        }
    }

    revalidatePath("/");
    return { success: true };
}

export async function deleteTransactionsBulk(ids: string[]) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    // 1. Get all transactions to adjust balances
    const { data: transactions, error: fetchError } = await supabase
        .from("expenses")
        .select("id, amount, type, account_id, to_account_id")
        .in("id", ids)
        .eq("user_id", session.user.id);

    if (fetchError || !transactions) return { error: "Transactions not found" };

    // 2. Delete transactions
    const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .in("id", ids)
        .eq("user_id", session.user.id);

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

    revalidatePath("/");
    return { success: true };
}

export async function createCategory(name: string, type: string = "expense", color: string = "#94a3b8") {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("categories")
        .insert({
            name,
            type,
            color,
            user_id: session.user.id,
            icon: "tag"
        })
        .select()
        .single();

    if (error) {
        console.error("Create category error:", error);
        return { error: "Failed to create category" };
    }

    revalidatePath("/");
    return { success: true, category: data };
}

export async function deleteCategory(id: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    // Only allow deleting categories owned by the user
    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

    if (error) {
        console.error("Delete category error:", error);
        return { error: "Failed to delete category" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function updateProfile(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const displayName = formData.get("displayName") as string;
    if (!displayName || displayName.length < 2) {
        return { error: "Name must be at least 2 characters" };
    }

    const supabase = createAdminClient();

    // Upsert profile
    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: session.user.id,
            display_name: displayName,
            currency: formData.get("currency"),
            email: session.user.email, // Include email to satisfy DB constraints
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Profile update error:", error);
        return { error: `Failed to update profile: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}

export async function signUserOut() {
    await logout();
    redirect("/login");
}

export async function getZakatHistory() {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("zakat_breakdown, zakat_target")
        .eq("id", session.user.id)
        .single();

    if (error) {
        console.error("Zakat history fetch error:", error);
        return { error: `Failed to fetch zakat history: ${error.message}` };
    }

    let rawBreakdown = data?.zakat_breakdown;
    let history: any = {};

    if (rawBreakdown) {
        try {
            let decrypted: string = "";
            if (typeof rawBreakdown === 'object' && 'encrypted' in rawBreakdown) {
                decrypted = decrypt(rawBreakdown.encrypted);
            } else if (typeof rawBreakdown === 'string') {
                decrypted = decrypt(rawBreakdown);
            } else {
                decrypted = JSON.stringify(rawBreakdown);
            }

            history = JSON.parse(decrypted);

            // Migration: check if it's the old flat format
            const keys = Object.keys(history);
            const hasYearKey = keys.some(k => /^\d{4}$/.test(k));
            const isFlat = keys.some(k => k === 'cashInHand' || k === 'cashInBank');

            if (!hasYearKey && isFlat) {
                const currentYear = new Date().getFullYear().toString();
                const target = data.zakat_target ? decryptNumber(data.zakat_target) : 0;
                history = {
                    [currentYear]: {
                        breakdown: history,
                        target: target
                    }
                };
            }
        } catch (e) {
            console.error("Failed to parse zakat history:", e);
            history = {};
        }
    }

    return { success: true, history };
}

export async function getZakatBreakdown(year?: string) {
    const res = await getZakatHistory();
    if (res.error) return res;

    const targetYear = year || new Date().getFullYear().toString();
    const data = res.history?.[targetYear] || { breakdown: {}, target: 0 };

    return {
        success: true,
        breakdown: data.breakdown || {},
        target: data.target || 0
    };
}

function BreakdownIsJSON(str: string) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

export async function updateZakatBreakdown(breakdown: any, year?: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();
    const targetYear = year || new Date().getFullYear().toString();

    // Get current history
    const historyRes = await getZakatHistory();
    const history = historyRes.success ? historyRes.history : {};

    // Update specific year
    if (!history[targetYear]) history[targetYear] = {};
    history[targetYear].breakdown = breakdown;

    // Encrypt the history data and wrap in object
    const encryptedHistory = {
        encrypted: encrypt(JSON.stringify(history))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            zakat_breakdown: encryptedHistory,
            updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

    if (error) {
        console.error("Zakat history breakdown update error:", error);
        return { error: `Failed to update zakat history: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}


export async function updateZakatTarget(amount: number, year?: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();
    const targetYear = year || new Date().getFullYear().toString();
    const currentYear = new Date().getFullYear().toString();

    // 1. Update Profile column if it's the current year (dashboard compatibility)
    if (targetYear === currentYear) {
        const encryptedTarget = encrypt(amount);
        await supabase
            .from("profiles")
            .update({
                zakat_target: encryptedTarget,
                updated_at: new Date().toISOString(),
            })
            .eq("id", session.user.id);
    }

    // 2. Update History in JSON
    const historyRes = await getZakatHistory();
    const history = historyRes.success ? historyRes.history : {};

    if (!history[targetYear]) history[targetYear] = {};
    history[targetYear].target = amount;

    const encryptedHistory = {
        encrypted: encrypt(JSON.stringify(history))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            zakat_breakdown: encryptedHistory,
            updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

    if (error) {
        console.error("Zakat target history update error:", error);
        return { error: `Failed to update zakat target history: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}

export async function voiceTransaction(text: string, localDate?: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    // 1. Fetch categories and accounts for AI context
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${session.user.id}`);

    const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id);

    if (!accounts || accounts.length === 0) {
        return { error: "Please create an account first before using voice entry." };
    }

    try {
        const aiResult = await parseTransactionWithAI(text, categories || [], accounts || [], localDate);

        // 2. Resolve account
        let account = accounts.find(a =>
            a.name.toLowerCase() === aiResult.account?.toLowerCase()
        ) || accounts[0]; // Default to first account if no match

        // 3. Resolve category
        let category = categories?.find(c =>
            c.name.toLowerCase() === aiResult.category?.toLowerCase()
        );

        if (!category) {
            // Create category if it doesn't exist
            const newCatResult = await createCategory(
                aiResult.category || "Uncategorized",
                aiResult.type || "expense"
            );
            if (newCatResult.error) throw new Error(newCatResult.error);
            category = newCatResult.category;
        }

        // 4. Resolve destination account for transfers
        let toAccount = null;
        if (aiResult.type === "transfer" && aiResult.toAccount) {
            toAccount = accounts.find(a =>
                a.name.toLowerCase() === aiResult.toAccount?.toLowerCase()
            );
        }

        // 5. Create transaction
        const formData = new FormData();
        formData.append("amount", aiResult.amount.toString());
        if (category) formData.append("category_id", category.id);
        formData.append("account_id", account.id);
        if (toAccount) formData.append("to_account_id", toAccount.id);
        formData.append("type", aiResult.type || "expense");
        formData.append("description", aiResult.description || text);
        formData.append("date", aiResult.date || localDate || new Date().toISOString().split('T')[0]);
        formData.append("time", new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); // Default to current local time
        // Note: new Date().toISOString() is UTC. If localDate is not provided, we fallback to UTC date.

        return await createTransaction(formData);
    } catch (error: any) {
        console.error("Voice transaction error:", error);
        return { error: error.message || "Failed to process voice transaction" };
    }
}

export async function parseVoiceTransaction(text: string, localDate?: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    // Fetch context
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${session.user.id}`);

    const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id);

    try {
        const aiResult = await parseTransactionWithAI(text, categories || [], accounts || [], localDate);
        return { success: true, aiResult };
    } catch (error: any) {
        console.error("Parse voice error:", error);
        return { error: error.message || "Failed to parse voice" };
    }
}

export async function generateInsights(expenses: any[], categories: any[], currencySymbol: string = "$", forceRefresh: boolean = false, localDate?: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    try {
        console.log("AI INSIGHTS: Request for user", session.user.id);

        // 1. Check for existing insights in DB
        const { data: existing, error: fetchError } = await supabase
            .from("ai_insights")
            .select("insights, created_at")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (fetchError) {
            console.error("AI INSIGHTS: Fetch error", fetchError.message);
        }

        if (existing && !fetchError && !forceRefresh) {
            const lastGenerated = new Date(existing.created_at);
            const now = new Date();
            const diffInDays = (now.getTime() - lastGenerated.getTime()) / (1000 * 3600 * 24);

            console.log(`AI INSIGHTS: Days since last generation: ${diffInDays.toFixed(2)}`);

            if (diffInDays < 5) {
                // Decrypt cached insights
                let decryptedInsights = existing.insights;
                if (existing.insights && typeof existing.insights === 'object' && 'encrypted' in existing.insights) {
                    const decrypted = decrypt(existing.insights.encrypted);
                    try {
                        decryptedInsights = JSON.parse(decrypted);
                    } catch (e) {
                        console.error("Failed to parse decrypted insights");
                    }
                }

                return {
                    success: true,
                    insights: decryptedInsights,
                    source: "cache",
                    lastUpdated: existing.created_at
                };
            }
        }

        // 2. Generate new insights
        console.log("AI INSIGHTS: Fetching fresh AI analysis...");

        // Fetch Zakat and Liabilities context to pass to AI
        const [zakatBreakdown, liabilitiesData, { data: profile }] = await Promise.all([
            getZakatBreakdown(),
            getLiabilitiesData(),
            supabase.from("profiles").select("zakat_target").eq("id", session.user.id).single()
        ]);

        const extraContext = {
            zakat: {
                breakdown: zakatBreakdown.success ? zakatBreakdown.breakdown : null,
                target: profile?.zakat_target ? Number(decrypt(profile.zakat_target)) : null
            },
            liabilities: liabilitiesData.success ? {
                total: liabilitiesData.liabilities?.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0),
                items: liabilitiesData.liabilities
            } : null
        };

        const insights = await getSmartInsights(expenses, categories, currencySymbol, localDate, extraContext);

        // 3. Save/Update in DB (Encrypted)
        const encryptedInsights = {
            encrypted: encrypt(JSON.stringify(insights))
        };

        // We MUST specify onConflict: 'user_id' because user_id is our unique identifier for caching
        const { error: saveError } = await supabase
            .from("ai_insights")
            .upsert({
                user_id: session.user.id,
                insights: encryptedInsights,
                created_at: new Date().toISOString()
            }, {
                onConflict: "user_id"
            });

        if (saveError) {
            console.error("AI INSIGHTS: SAVE ERROR ->", saveError.message);
            // Return insights anyway so user sees them, but they won't be cached
            return { success: true, insights, source: "ai-bypass-error", error: saveError.message };
        }

        console.log("AI INSIGHTS: Saved successfully to database");
        return {
            success: true,
            insights,
            source: "ai",
            lastUpdated: new Date().toISOString()
        };
    } catch (error: any) {
        console.error("AI INSIGHTS: CRITICAL ERROR", error);
        return { error: error.message || "Failed to generate insights" };
    }
}

export async function updateCategoryTarget(categoryId: string, target: number) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("category_targets")
        .upsert({
            user_id: session.user.id,
            category_id: categoryId,
            target: target,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,category_id'
        });

    if (error) {
        console.error("Update category target error:", error);
        return { error: `Failed to update target: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}

export async function getMonthlyCategorySpending() {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: expenses, error } = await supabase
        .from("expenses")
        .select("amount, category_id")
        .eq("user_id", session.user.id)
        .eq("type", "expense")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

    if (error) {
        console.error("Fetch monthly spending error:", error);
        return { error: "Failed to fetch spending" };
    }

    const spending: Record<string, number> = {};

    // Decrypt and aggregate
    expenses.forEach((ex: any) => {
        const amount = Number(decrypt(ex.amount));
        if (ex.category_id) {
            spending[ex.category_id] = (spending[ex.category_id] || 0) + amount;
        }
    });

    return { success: true, spending };
}

export async function getLiabilitiesData() {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("liabilities_data")
        .eq("id", session.user.id)
        .single();

    if (error) {
        // If the column doesn't exist, we'll get an error. 
        // We'll handle this by returning default values.
        console.error("Liabilities fetch error:", error);
        return { success: true, liabilities: [], calculate: false };
    }

    let rawData = data?.liabilities_data;
    if (!rawData) return { success: true, liabilities: [], calculate: false };

    try {
        if (typeof rawData === 'object' && 'encrypted' in rawData) {
            const decrypted = decrypt(rawData.encrypted);
            const parsed = JSON.parse(decrypted);
            return {
                success: true,
                liabilities: parsed.liabilities || [],
                calculate: parsed.calculate || false
            };
        }
        return {
            success: true,
            liabilities: rawData.liabilities || [],
            calculate: rawData.calculate || false
        };
    } catch (e) {
        console.error("Failed to parse liabilities data:", e);
        return { success: true, liabilities: [], calculate: false };
    }
}

export async function updateLiabilitiesData(liabilities: any[], calculate: boolean) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const cleanData = { liabilities, calculate };
    const encryptedData = {
        encrypted: encrypt(JSON.stringify(cleanData))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            liabilities_data: encryptedData,
            updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

    if (error) {
        console.error("Liabilities update error:", error);
        return { error: `Failed to update liabilities: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}

export async function getLentData() {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("lent_data")
        .eq("id", session.user.id)
        .single();

    if (error) {
        console.error("Lent money fetch error:", error);
        return { success: true, lent: [], calculate: false };
    }

    let rawData = data?.lent_data;
    if (!rawData) return { success: true, lent: [], calculate: false };

    try {
        if (typeof rawData === 'object' && 'encrypted' in rawData) {
            const decrypted = decrypt(rawData.encrypted);
            const parsed = JSON.parse(decrypted);
            return {
                success: true,
                lent: parsed.lent || [],
                calculate: parsed.calculate || false
            };
        }
        return {
            success: true,
            lent: rawData.lent || [],
            calculate: rawData.calculate || false
        };
    } catch (e) {
        console.error("Failed to parse lent money data:", e);
        return { success: true, lent: [], calculate: false };
    }
}

export async function updateLentData(lent: any[], calculate: boolean) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const cleanData = { lent, calculate };
    const encryptedData = {
        encrypted: encrypt(JSON.stringify(cleanData))
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            lent_data: encryptedData,
            updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

    if (error) {
        console.error("Lent money update error:", error);
        return { error: `Failed to update lent money: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
}
