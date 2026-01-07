"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { login, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

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

    // Login (vaultKey is no longer used/generated)
    await login({ id: user.id, email: user.email });
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

    // Login directly
    await login({ id: user.id, email: user.email });
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

    // 2. Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
        .from("profiles")
        .update({ password_hash: passwordHash })
        .eq("id", session.user.id);

    if (error) return { error: "Failed to update password hash" };

    // 3. Login again
    await login({ id: session.user.id, email: session.user.email });

    revalidatePath("/");
    return { success: true };
}
