"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@dmin2025";

export async function adminLogin(formData: FormData) {
    const password = formData.get("password") as string;

    if (password === ADMIN_PASSWORD) {
        const cookieStore = await cookies();
        // Set cookie for 24 hours
        cookieStore.set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/"
        });
        return { success: true };
    }

    return { error: "Invalid password" };
}

export async function adminLogout() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/admin");
}

export async function checkAdminSession() {
    const cookieStore = await cookies();
    return cookieStore.has("admin_session");
}

export async function getAdminStats() {
    const cookieStore = await cookies();
    if (!cookieStore.has("admin_session")) {
        throw new Error("Unauthorized");
    }

    const supabase = createAdminClient();

    try {
        // 1. Fetch Users (Profiles)
        // We want newly registered users.
        // If profiles table has created_at, use it. Otherwise rely on updated_at or ordering by ID if strictly necessary (but ID is likely random UUID).
        // Let's assume created_at exists or we just show the unsorted/default order list.
        // Most likely Supabase adds created_at.

        // We also want total counts.
        // 1. Fetch ALL Users (Profiles)
        const { count: usersCount, data: users, error: usersError } = await supabase
            .from("profiles")
            .select("id, email, display_name, created_at, updated_at, currency", { count: "exact" })
            .order("created_at", { ascending: false });

        if (usersError) {
            console.error("Admin fetch users error:", usersError);
        }

        // 2. Transaction Stats (Aggregated & Per User)
        // Fetch ALL expenses (just limit to user_id to save bandwidth)
        const { data: allExpenses, error: txError, count: transactionsCount } = await supabase
            .from("expenses")
            .select("user_id", { count: "exact" });

        // Aggregate transactions by user
        const transactionsByUser: Record<string, number> = {};
        if (allExpenses) {
            allExpenses.forEach((tx: any) => {
                if (tx.user_id) {
                    transactionsByUser[tx.user_id] = (transactionsByUser[tx.user_id] || 0) + 1;
                }
            });
        }

        // Map users to include their transaction counts
        const usersWithStats = users?.map(user => ({
            ...user,
            transactionCount: transactionsByUser[user.id] || 0
        })) || [];

        // 3. AI Insights usage
        const { count: insightsCount, error: aiError } = await supabase
            .from("ai_insights")
            .select("*", { count: "exact", head: true });

        // 4. Supabase usage (Approximation)
        return {
            users: {
                count: usersCount || 0,
                all: usersWithStats
            },
            system: {
                totalTransactions: transactionsCount || 0,
                totalInsights: insightsCount || 0
            }
        };
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return {
            users: { count: 0, all: [] },
            system: { totalTransactions: 0, totalInsights: 0 }
        };
    }
}
