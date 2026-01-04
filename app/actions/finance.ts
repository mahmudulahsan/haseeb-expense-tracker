"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, logout } from "@/lib/auth";
import { accountSchema, transactionSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseTransactionWithAI, getSmartInsights } from "@/services/ai";
import { encrypt, decrypt } from "@/lib/crypto";


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

    const { error } = await supabase.from("accounts").insert({
        ...validatedFields.data,
        user_id: session.user.id,
    });

    if (error) {
        console.error("Database error:", error);
        return { error: `Failed to create account: ${error.message}` };
    }

    revalidatePath("/");
    return { success: true };
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
        date: formData.get("date"),
        time: formData.get("time"),
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
    const { error: txError } = await supabase.from("expenses").insert({
        ...transaction,
        user_id: session.user.id,
    });

    if (txError) {
        console.error("Tx Database error:", txError);
        return { error: "Failed to record transaction" };
    }

    // 3. Update balance
    const newBalance = transaction.type === "income"
        ? account.balance + originalAmount
        : account.balance - originalAmount;

    const { error: updateError } = await supabase
        .from("accounts")
        .update({ balance: newBalance })
        .eq("id", transaction.account_id);

    if (updateError) {
        console.error("Balance update error:", updateError);
        // Warning: This creates inconsistency if Tx succeeds but balance update fails.
        // In production, use Supabase RPC or Database Triggers for atomicity.
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
        .select("amount, type, account_id")
        .eq("id", id)
        .single();

    if (fetchError || !tx) return { error: "Transaction not found" };

    // 2. Delete transaction
    const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

    if (deleteError) {
        console.error("Delete transaction error:", deleteError);
        return { error: "Failed to delete transaction" };
    }

    // 3. Revert balance
    if (tx.account_id) {
        const { data: account } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", tx.account_id)
            .single();

        if (account) {
            const amount = Number(decrypt(tx.amount));
            const newBalance = tx.type === "income"
                ? Number(account.balance) - amount
                : Number(account.balance) + amount;

            await supabase
                .from("accounts")
                .update({ balance: newBalance })
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
        .select("id, amount, type, account_id")
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
        if (!tx.account_id) continue;
        const amount = Number(decrypt(tx.amount));
        const adjustment = tx.type === "income" ? -amount : amount;
        balanceAdjustments[tx.account_id] = (balanceAdjustments[tx.account_id] || 0) + adjustment;
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

export async function updateZakatTarget(amount: number) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("profiles")
        .update({
            zakat_target: amount,
            updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

    if (error) {
        console.error("Zakat update error:", error);
        return { error: `Failed to update zakat target: ${error.message}` };
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

        // 4. Create transaction
        const formData = new FormData();
        formData.append("amount", aiResult.amount.toString());
        formData.append("category_id", category.id);
        formData.append("account_id", account.id);
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
                return {
                    success: true,
                    insights: existing.insights,
                    source: "cache",
                    lastUpdated: existing.created_at
                };
            }
        }

        // 2. Generate new insights
        console.log("AI INSIGHTS: Fetching fresh AI analysis...");
        const insights = await getSmartInsights(expenses, categories, currencySymbol, localDate);

        // 3. Save/Update in DB
        // We MUST specify onConflict: 'user_id' because user_id is our unique identifier for caching
        const { error: saveError } = await supabase
            .from("ai_insights")
            .upsert({
                user_id: session.user.id,
                insights,
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
