"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { login, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/lib/crypto";
import { createHash } from "crypto";

async function reEncryptUserData(supabase: any, userId: string, oldVaultKey: string | undefined, newVaultKey: string) {
    // --- Re-encrypt Expenses ---
    const { data: expenses } = await supabase
        .from("expenses")
        .select("id, description, amount")
        .eq("user_id", userId);

    if (expenses && expenses.length > 0) {
        for (const expense of expenses) {
            const decryptedDesc = expense.description ? decrypt(expense.description, oldVaultKey) : null;
            const decryptedAmount = expense.amount ? decrypt(expense.amount.toString(), oldVaultKey) : null;

            const updates: any = {};
            if (decryptedDesc) updates.description = encrypt(decryptedDesc, newVaultKey);
            if (decryptedAmount) updates.amount = encrypt(decryptedAmount, newVaultKey);

            if (Object.keys(updates).length > 0) {
                await supabase.from("expenses").update(updates).eq("id", expense.id);
            }
        }
    }

    // --- Re-encrypt Profile (Zakat) ---
    const { data: profile } = await supabase
        .from("profiles")
        .select("zakat_target, zakat_breakdown")
        .eq("id", userId)
        .single();

    if (profile) {
        const updates: any = {};

        if (profile.zakat_target && typeof profile.zakat_target === 'string' && profile.zakat_target.includes(':')) {
            const decryptedTarget = decrypt(profile.zakat_target, oldVaultKey);
            updates.zakat_target = encrypt(decryptedTarget, newVaultKey);
        }

        if (profile.zakat_breakdown) {
            let decryptedBreakdown = null;
            if (typeof profile.zakat_breakdown === 'object' && 'encrypted' in profile.zakat_breakdown) {
                decryptedBreakdown = decrypt((profile.zakat_breakdown as any).encrypted, oldVaultKey);
            } else if (typeof profile.zakat_breakdown === 'string') {
                decryptedBreakdown = decrypt(profile.zakat_breakdown, oldVaultKey);
            }

            if (decryptedBreakdown) {
                updates.zakat_breakdown = {
                    encrypted: encrypt(decryptedBreakdown, newVaultKey)
                };
            }
        }

        if (Object.keys(updates).length > 0) {
            await supabase.from("profiles").update(updates).eq("id", userId);
        }
    }

    // --- Re-encrypt AI Insights ---
    const { data: insights } = await supabase
        .from("ai_insights")
        .select("id, insights")
        .eq("user_id", userId)
        .maybeSingle();

    if (insights && insights.insights && typeof insights.insights === 'object' && 'encrypted' in insights.insights) {
        const decryptedInsights = decrypt((insights.insights as any).encrypted, oldVaultKey);
        await supabase.from("ai_insights")
            .update({
                insights: {
                    encrypted: encrypt(decryptedInsights, newVaultKey)
                }
            })
            .eq("id", insights.id);
    }
}

export async function setPassword(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!email || !password || !confirmPassword) {
        return { error: "All fields are required" };
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    const supabase = createAdminClient();
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
        .from("profiles")
        .update({ password_hash: passwordHash })
        .eq("email", email)
        .select()
        .single();

    if (error || !user) {
        console.error("Set password error:", error);
        return { error: "Failed to set password" };
    }

    // Re-encrypt existing data from legacy to v2
    const session = await getSession();
    const oldVaultKey = session?.vaultKey; // likely undefined if just verified OTP
    const newVaultKey = createHash("sha256").update(password).digest("hex");

    try {
        await reEncryptUserData(supabase, user.id, oldVaultKey, newVaultKey);
    } catch (e) {
        console.error("Re-encryption error in setPassword:", e);
        // Continue anyway as setting the password is the priority
    }

    await login({ id: user.id, email: user.email }, password);
    return { success: true };
}

export async function loginWithPassword(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
        .from("profiles")
        .select("id, email, password_hash")
        .eq("email", email)
        .single();

    if (error || !user || !user.password_hash) {
        return { error: "Invalid email or password" };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        return { error: "Invalid email or password" };
    }

    await login({ id: user.id, email: user.email }, password);
    return { success: true };
}

export async function changePassword(formData: FormData) {
    const session = await getSession();

    if (!session) return { error: "Unauthorized" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || !confirmPassword) {
        return { error: "New password fields are required" };
    }

    if (newPassword !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    if (newPassword.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    const supabase = createAdminClient();

    // 1. Verify current password
    const { data: user } = await supabase
        .from("profiles")
        .select("password_hash, id")
        .eq("id", session.user.id)
        .single();

    if (!user) return { error: "User not found" };

    if (user.password_hash && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return { error: "Current password is incorrect" };
    } else if (user.password_hash && !currentPassword) {
        return { error: "Current password is required to change it" };
    }

    // 2. Prepare for re-encryption
    const oldVaultKey = session.vaultKey;
    const newVaultKey = createHash("sha256").update(newPassword).digest("hex");

    try {
        await reEncryptUserData(supabase, user.id, oldVaultKey, newVaultKey);
    } catch (reEncryptError) {
        console.error("Re-encryption error during password change:", reEncryptError);
        return { error: "Failed to update data for new password. Please try again." };
    }

    // 3. Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
        .from("profiles")
        .update({ password_hash: passwordHash })
        .eq("id", session.user.id);

    if (error) return { error: "Failed to update password hash" };

    // 4. Update session with new password (vaultKey)
    await login({ id: session.user.id, email: session.user.email }, newPassword);

    revalidatePath("/");
    return { success: true };
}
