"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { login } from "@/lib/auth";
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

    await login({ id: user.id, email: user.email });
    return { success: true };
}

export async function changePassword(formData: FormData) {
    const { getSession } = await import("@/lib/auth");
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

    // 1. Verify current password if provided
    const { data: user } = await supabase
        .from("profiles")
        .select("password_hash")
        .eq("id", session.user.id)
        .single();

    if (user?.password_hash && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return { error: "Current password is incorrect" };
    }

    // 2. Hash and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
        .from("profiles")
        .update({ password_hash: passwordHash })
        .eq("id", session.user.id);

    if (error) return { error: "Failed to update password" };

    return { success: true };
}
