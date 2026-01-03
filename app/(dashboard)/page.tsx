import { getExpenses, getCategories } from "@/services/expenses";
import { getAccounts } from "@/services/accounts";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrencySymbol } from "@/lib/utils";
import { getProfile } from "@/services/profile";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export default async function DashboardPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const { user } = session;

    // Fetch all data in parallel
    const [expenses, accounts, categories, profile] = await Promise.all([
        getExpenses().catch(() => []),
        getAccounts().catch(() => []),
        getCategories().catch(() => []),
        getProfile().catch(() => null),
    ]);

    const greeting = profile?.display_name
        ? `Hey, ${profile.display_name}!`
        : "What should I call you?";

    const currencySymbol = getCurrencySymbol(profile?.currency || "USD");

    const totalSpent = expenses
        .filter((e: any) => e.type === "expense")
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const totalIncome = expenses
        .filter((e: any) => e.type === "income")
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    return (
        <DashboardTabs
            expenses={expenses}
            accounts={accounts}
            categories={categories}
            greeting={greeting}
            currencySymbol={currencySymbol}
            totalIncome={totalIncome}
            totalSpent={totalSpent}
            zakatTarget={profile?.zakat_target || 0}
        />
    );
}
