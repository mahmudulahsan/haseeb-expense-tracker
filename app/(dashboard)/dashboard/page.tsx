import { getExpenses, getCategories } from "@/services/expenses";
import { getAccounts } from "@/services/accounts";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { AddAccountDialog } from "@/components/dashboard/add-account-dialog";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { DeleteAccountButton } from "@/components/dashboard/delete-account-button";
import { DeleteTransactionButton } from "@/components/dashboard/delete-transaction-button";
import { MainBalance } from "@/components/dashboard/main-balance";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    MoreHorizontal,
    PiggyBank,
    Zap,
    Utensils,
    ShoppingBag,
    Plane,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatisticsContent } from "@/components/dashboard/statistics-content";
import { getProfile } from "@/services/profile";

export default async function DashboardPage(props: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const searchParams = await props.searchParams;
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const { user } = session;
    const activeTab = searchParams.tab || "home";

    // Fetch all data in parallel
    const [expenses, accounts, categories, profile] = await Promise.all([
        getExpenses().catch(() => []),
        getAccounts().catch(() => []),
        getCategories().catch(() => []),
        getProfile().catch(() => null),
    ]);

    if (!profile?.display_name) {
        // Optional: If no name is set, you could show a different greeting or force the profile setup
    }

    const greeting = profile?.display_name
        ? `Hey, ${profile.display_name}!`
        : "What should I call you?";

    const totalSpent = expenses
        .filter((e: any) => e.type === "expense")
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const totalIncome = expenses
        .filter((e: any) => e.type === "income")
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const netBalance = accounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);
    const mainAccount = accounts[0] || { name: "No Account", balance: 0, type: "N/A" };

    if (activeTab === "statistic") {
        return <StatisticsContent expenses={expenses} categories={categories} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Grid: Balance and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Card (Primary Account) */}
                <Card className="lg:col-span-8 bg-[#FFD966] dark:bg-amber-500/20 border-none shadow-xl overflow-hidden relative group">
                    <CardContent className="p-10">
                        <MainBalance accounts={accounts} categories={categories} greeting={greeting}>
                            <AddTransactionDialog accounts={accounts} categories={categories} />
                        </MainBalance>
                    </CardContent>
                </Card>

                {/* Vertical Secondary Stats */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <StatCard
                        title="Monthly Income"
                        value={`$${totalIncome.toLocaleString()}`}
                        change="+12.5%"
                        icon={ArrowUpRight}
                        color="bg-emerald-500 text-white"
                    />
                    <StatCard
                        title="Monthly Outcome"
                        value={`$${totalSpent.toLocaleString()}`}
                        change="+5.2%"
                        icon={ArrowDownRight}
                        color="bg-orange-500 text-white"
                    />
                </div>
            </div>

            {/* Middle Grid: Portfolio and Savings Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* My Accounts */}
                <Card className="border-none shadow-sm h-full overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">My Accounts</CardTitle>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                        {accounts.length === 0 ? (
                            <div className="text-center py-8 opacity-50 text-sm italic">
                                No accounts added yet.
                            </div>
                        ) : accounts.map((acc: any) => (
                            <div
                                key={acc.id}
                                className={cn(
                                    "p-6 rounded-[1.5rem] flex items-center justify-between group transition-all hover:scale-[1.02]",
                                    acc.type === 'Savings' ? "bg-[#E2F0D9] dark:bg-emerald-950/40" :
                                        acc.type === 'Investment' ? "bg-[#FFF2CC] dark:bg-amber-950/40" :
                                            "bg-gray-100 dark:bg-white/10"
                                )}
                            >
                                <div>
                                    <h4 className="text-2xl font-bold">${Number(acc.balance).toLocaleString()}</h4>
                                    <div className="flex items-center gap-2">
                                        <p className={cn(
                                            "text-xs font-semibold mt-1 uppercase tracking-wider",
                                            acc.type === 'Savings' ? "text-emerald-600" :
                                                acc.type === 'Investment' ? "text-amber-600" :
                                                    "text-muted-foreground"
                                        )}>{acc.name}</p>
                                        <DeleteAccountButton id={acc.id} name={acc.name} />
                                    </div>
                                </div>
                                <div className="h-10 w-10 bg-white/50 dark:bg-black/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <DynamicIcon name={acc.icon || "Wallet"} className="h-5 w-5" />
                                </div>
                            </div>
                        ))}
                        <AddAccountDialog />
                    </CardContent>
                </Card>

                {/* Savings Statistic (Bento Middle) */}
                <Card className="border-none shadow-sm lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Ledger</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-orange-500 text-white border-none px-3">Journal</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Recent Transactions Modern List */}
                        <div className="space-y-4 max-h-[450px] overflow-y-auto no-scrollbar pr-2">
                            {expenses.length === 0 ? (
                                <div className="text-center py-20 opacity-30 italic">No activity yet.</div>
                            ) : expenses.map((expense: any) => (
                                <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-[1rem] shadow-sm flex items-center justify-center font-bold",
                                            expense.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                                        )}>
                                            {expense.categories?.name?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <p className="font-bold">{expense.description}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{expense.date}</p>
                                                <span className="text-[8px] opacity-30">•</span>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                    {accounts.find(a => a.id === expense.account_id)?.name || "External"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <p className={cn(
                                                "font-black text-lg",
                                                expense.type === 'income' ? "text-emerald-500" : "text-orange-500"
                                            )}>
                                                {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
                                            </p>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-5 px-2">
                                                {expense.type}
                                            </Badge>
                                        </div>
                                        <DeleteTransactionButton id={expense.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
