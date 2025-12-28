"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { MainBalance } from "@/components/dashboard/main-balance";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { DeleteAccountButton } from "@/components/dashboard/delete-account-button";
import { DeleteTransactionButton } from "@/components/dashboard/delete-transaction-button";
import { AddAccountDialog } from "@/components/dashboard/add-account-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LedgerList } from "@/components/dashboard/ledger-list";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface HomeContentProps {
    expenses: any[];
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol: string;
    totalIncome: number;
    totalSpent: number;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function HomeContent({
    expenses,
    accounts,
    categories,
    greeting,
    currencySymbol,
    totalIncome,
    totalSpent
}: HomeContentProps) {
    const now = new Date();
    const searchParams = useSearchParams();
    const query = searchParams.get("q")?.toLowerCase() || "";

    const [filterMonth, setFilterMonth] = useState<string>((now.getMonth() + 1).toString().padStart(2, '0'));
    const [filterYear, setFilterYear] = useState<string>(now.getFullYear().toString());

    const [filterCategory, setFilterCategory] = useState<string>("all");

    const [detailedAccount, setDetailedAccount] = useState<any>(null);
    const [accountFilterMonth, setAccountFilterMonth] = useState<string>((now.getMonth() + 1).toString().padStart(2, '0'));
    const [accountFilterYear, setAccountFilterYear] = useState<string>(now.getFullYear().toString());

    // Generate years from data or defaults
    const years = useMemo(() => {
        const expenseYears = expenses.map(e => new Date(e.date).getFullYear());
        const currentYear = new Date().getFullYear();
        const uniqueYears = Array.from(new Set([...expenseYears, currentYear])).sort((a, b) => b - a);
        return uniqueYears.map(String);
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const m = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
            const y = expenseDate.getFullYear().toString();
            const matchesDate = m === filterMonth && y === filterYear;
            const matchesCategory = filterCategory === "all" || expense.category_id === filterCategory;

            // Search filter
            const matchesSearch = !query ||
                expense.description?.toLowerCase().includes(query) ||
                expense.categories?.name?.toLowerCase().includes(query) ||
                accounts.find(a => a.id === expense.account_id)?.name?.toLowerCase().includes(query);

            return matchesDate && matchesCategory && matchesSearch;
        });
    }, [expenses, filterMonth, filterYear, filterCategory, query, accounts]);

    const totalNet = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => {
            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    }, [filteredExpenses]);

    const accountDetailedExpenses = useMemo(() => {
        if (!detailedAccount) return [];
        return expenses.filter(expense => {
            const matchesAccount = expense.account_id === detailedAccount.id;
            const expenseDate = new Date(expense.date);
            const m = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
            const y = expenseDate.getFullYear().toString();
            const matchesDate = m === accountFilterMonth && y === accountFilterYear;
            return matchesAccount && matchesDate;
        });
    }, [expenses, detailedAccount, accountFilterMonth, accountFilterYear]);

    const accountTotalNet = useMemo(() => {
        return accountDetailedExpenses.reduce((acc, curr) => {
            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    }, [accountDetailedExpenses]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Grid: Balance and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Card (Primary Account) */}
                <Card className="lg:col-span-8 bg-[#FFD966] dark:bg-primary/10 border-none shadow-xl overflow-hidden relative group">
                    <CardContent className="p-10">
                        <MainBalance accounts={accounts} categories={categories} greeting={greeting} currencySymbol={currencySymbol}>
                            <AddTransactionDialog accounts={accounts} categories={categories} currencySymbol={currencySymbol} />
                        </MainBalance>
                    </CardContent>
                </Card>

                {/* Vertical Secondary Stats */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <StatCard
                        title="Monthly Income"
                        value={`${currencySymbol}${totalIncome.toLocaleString()}`}
                        change="+12.5%"
                        icon={ArrowUpRight}
                        color="bg-emerald-500 text-white"
                    />
                    <StatCard
                        title="Monthly Outcome"
                        value={`${currencySymbol}${totalSpent.toLocaleString()}`}
                        change="+5.2%"
                        icon={ArrowDownRight}
                        color="bg-orange-500 text-white"
                    />
                </div>
            </div>

            {/* Middle Grid: Portfolio and Savings Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* My Accounts */}
                <Card className="border-none shadow-sm h-full overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-black truncate">My Accounts</CardTitle>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-0.5 truncate">Asset Portfolio</p>
                        </div>
                        <AddAccountDialog variant="compact" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-2 gap-3 max-h-[560px] overflow-y-auto custom-scrollbar mask-scroller smooth-scroll pr-1">
                            {accounts.length === 0 ? (
                                <div className="col-span-2 text-center py-12 opacity-30 italic text-sm">
                                    No accounts added yet.
                                </div>
                            ) : accounts.map((acc: any) => (
                                <div
                                    key={acc.id}
                                    onClick={() => {
                                        setDetailedAccount(acc);
                                        setAccountFilterMonth(filterMonth);
                                        setAccountFilterYear(filterYear);
                                    }}
                                    className={cn(
                                        "relative p-4 rounded-[1.5rem] flex flex-col justify-between aspect-[1.1/1] group transition-all duration-300 border-2 border-transparent hover:border-dashed hover:border-primary/30 cursor-pointer overflow-hidden",
                                        acc.type === 'Savings' ? "bg-[#E2F0D9] dark:bg-emerald-950/40" :
                                            acc.type === 'Investment' ? "bg-[#FFF2CC] dark:bg-amber-950/40" :
                                                "bg-gray-100 dark:bg-white/10"
                                    )}
                                >
                                    {/* Card Top: Icon & Delete */}
                                    <div className="flex items-start justify-between">
                                        <div className="h-8 w-8 bg-white/60 dark:bg-black/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm relative z-10">
                                            <DynamicIcon name={acc.icon || "Wallet"} className="h-4 w-4" />
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity relative z-10" onClick={(e) => e.stopPropagation()}>
                                            <DeleteAccountButton id={acc.id} name={acc.name} />
                                        </div>
                                    </div>

                                    {/* Card Content: Balance & Name */}
                                    <div className="mt-4">
                                        <h4 className="text-lg font-black tracking-tighter truncate">
                                            {currencySymbol}{Number(acc.balance).toLocaleString()}
                                        </h4>
                                        <p className={cn(
                                            "text-[9px] font-black mt-1 uppercase tracking-[0.15em] truncate opacity-70",
                                            acc.type === 'Savings' ? "text-emerald-700 dark:text-emerald-400" :
                                                acc.type === 'Investment' ? "text-amber-700 dark:text-amber-400" :
                                                    "text-muted-foreground"
                                        )}>
                                            {acc.name}
                                        </p>
                                    </div>

                                    {/* Decoration */}
                                    <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity translate-x-1 translate-y-1">
                                        <DynamicIcon name={acc.icon || "Wallet"} className="h-10 w-10 rotate-[-15deg]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Ledger (Bento Middle) */}
                <Card className={cn(
                    "border-none shadow-sm lg:col-span-2 transition-all duration-500",
                    query && "ring-2 ring-primary ring-offset-2 dark:ring-offset-black shadow-2xl scale-[1.01]"
                )}>

                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg whitespace-nowrap">Recent Ledger</CardTitle>
                            <Badge className="bg-orange-500 text-white border-none px-3 h-5">Journal</Badge>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                            <div className="flex-1 sm:flex-initial flex items-center gap-0.5 sm:gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="h-8 min-w-[80px] sm:min-w-[100px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-2 sm:px-3">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                                className="text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1 shrink-0" />

                                <Select value={filterMonth} onValueChange={setFilterMonth}>
                                    <SelectTrigger className="h-8 min-w-[90px] sm:min-w-[120px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-2 sm:px-3">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {MONTHS.map((month, idx) => (
                                            <SelectItem
                                                key={month}
                                                value={(idx + 1).toString().padStart(2, '0')}
                                                className="text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1 shrink-0" />

                                <Select value={filterYear} onValueChange={setFilterYear}>
                                    <SelectTrigger className="h-8 min-w-[70px] sm:min-w-[85px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-2 sm:px-3">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {years.map(year => (
                                            <SelectItem
                                                key={year}
                                                value={year}
                                                className="text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="p-1.5 text-primary/40 mr-1 shrink-0">
                                    <Filter className="h-3 w-3" />
                                </div>
                            </div>

                            <div className="shrink-0">

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-100/50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all">
                                            <Maximize2 className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-2xl bg-white/95 dark:bg-black/95 backdrop-blur-xl">
                                        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mb-6 pr-0 sm:pr-10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center">
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <DialogTitle className="text-lg sm:text-xl font-black truncate">Transaction Ledger</DialogTitle>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                                        {MONTHS[parseInt(filterMonth) - 1]} {filterYear}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-orange-500 text-white border-none px-4 py-1 h-fit text-[10px] sm:text-xs font-black uppercase tracking-widest w-fit">Journal</Badge>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-hidden">
                                            <LedgerList
                                                expenses={filteredExpenses}
                                                accounts={accounts}
                                                currencySymbol={currencySymbol}
                                                maxHeight="100%"
                                            />
                                        </div>
                                        {filteredExpenses.length > 0 && (
                                            <div className="mt-auto pt-4 sm:pt-6 border-t border-dashed border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                                    </div>
                                                    <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-muted-foreground">Snapshot Net Total</span>
                                                </div>
                                                <p className={cn(
                                                    "text-2xl sm:text-3xl font-black tracking-tighter",
                                                    totalNet >= 0 ? "text-emerald-500" : "text-orange-500"
                                                )}>
                                                    {totalNet >= 0 ? '+' : ''}{currencySymbol}{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Recent Transactions Modern List */}
                        <LedgerList
                            expenses={filteredExpenses}
                            accounts={accounts}
                            currencySymbol={currencySymbol}
                            maxHeight="560px"
                        />

                        {filteredExpenses.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Filter className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Month Net Total</span>
                                </div>
                                <p className={cn(
                                    "text-xl font-black tracking-tight",
                                    totalNet >= 0 ? "text-emerald-500" : "text-orange-500"
                                )}>
                                    {totalNet >= 0 ? '+' : ''}{currencySymbol}{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Account Specific Ledger Modal */}
            <Dialog open={!!detailedAccount} onOpenChange={(open) => !open && setDetailedAccount(null)}>
                <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-2xl bg-white/95 dark:bg-black/95 backdrop-blur-xl">
                    <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mb-6 pr-0 sm:pr-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn(
                                "h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-6 shrink-0",
                                detailedAccount?.type === 'Savings' ? "bg-[#E2F0D9] text-emerald-600 shadow-emerald-500/10" :
                                    detailedAccount?.type === 'Investment' ? "bg-[#FFF2CC] text-amber-600 shadow-amber-500/10" :
                                        "bg-gray-100 dark:bg-white/10 text-primary"
                            )}>
                                <DynamicIcon name={detailedAccount?.icon || "Wallet"} className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight truncate">{detailedAccount?.name} History</DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 opacity-70">
                                        {detailedAccount?.type}
                                    </Badge>
                                    <span className="text-[8px] opacity-20">•</span>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                        {MONTHS[parseInt(accountFilterMonth) - 1]} {accountFilterYear}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl sm:rounded-[1.25rem] w-fit">
                            <Select value={accountFilterMonth} onValueChange={setAccountFilterMonth}>
                                <SelectTrigger className="h-8 sm:h-9 border-none bg-transparent focus:ring-0 text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-none px-2 sm:px-4">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    {MONTHS.map((month, idx) => (
                                        <SelectItem
                                            key={month}
                                            value={(idx + 1).toString().padStart(2, '0')}
                                            className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
                                        >
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

                            <Select value={accountFilterYear} onValueChange={setAccountFilterYear}>
                                <SelectTrigger className="h-8 sm:h-9 border-none bg-transparent focus:ring-0 text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-none px-2 sm:px-4">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    {years.map(year => (
                                        <SelectItem
                                            key={year}
                                            value={year}
                                            className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <LedgerList
                            expenses={accountDetailedExpenses}
                            accounts={accounts}
                            currencySymbol={currencySymbol}
                            maxHeight="100%"
                        />
                    </div>

                    {accountDetailedExpenses.length > 0 && (
                        <div className="mt-auto pt-4 sm:pt-8 border-t border-dashed border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Account Monthly Performance</span>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full shrink-0",
                                        accountTotalNet >= 0 ? "bg-emerald-500 animate-pulse" : "bg-orange-500 animate-pulse"
                                    )} />
                                    <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest">
                                        {accountTotalNet >= 0 ? 'Surplus' : 'Deficit'} for {MONTHS[parseInt(accountFilterMonth) - 1]}
                                    </span>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className={cn(
                                    "text-2xl sm:text-4xl font-black tracking-tighter leading-none",
                                    accountTotalNet >= 0 ? "text-emerald-500" : "text-orange-500"
                                )}>
                                    {accountTotalNet >= 0 ? '+' : ''}{currencySymbol}{accountTotalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
