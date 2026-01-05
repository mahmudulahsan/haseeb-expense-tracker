"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings2, CheckCircle2, Circle, HandHeart, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpendingHeatmap } from "@/components/dashboard/spending-heatmap";
import { parseLocalDate } from "@/lib/date-utils";

interface MainBalanceProps {
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol?: string;
    expenses: any[];
    zakatTarget: number;
    children: React.ReactNode; // For the AddTransactionDialog
}

export function MainBalance({ accounts, categories, greeting, currencySymbol = "$", expenses, zakatTarget, children }: MainBalanceProps) {
    // Load selected accounts from localStorage or default to all accounts
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedAccountIds');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return accounts.map((acc) => acc.id);
                }
            }
        }
        return accounts.map((acc) => acc.id);
    });

    const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('isBalanceVisible');
            return saved !== 'false'; // Default to true
        }
        return true;
    });

    // Save to localStorage whenever selection changes
    useEffect(() => {
        localStorage.setItem('selectedAccountIds', JSON.stringify(selectedAccountIds));
    }, [selectedAccountIds]);

    useEffect(() => {
        localStorage.setItem('isBalanceVisible', JSON.stringify(isBalanceVisible));
    }, [isBalanceVisible]);

    const toggleAccount = (id: string) => {
        setSelectedAccountIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const filteredAccounts = useMemo(() => {
        return accounts.filter((acc) => selectedAccountIds.includes(acc.id));
    }, [accounts, selectedAccountIds]);

    const filteredCount = filteredAccounts.length;

    const displayBalance = useMemo(() => {
        return filteredAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    }, [filteredAccounts]);

    const activeAccountNames = filteredAccounts
        .map((acc) => acc.name)
        .join(", ");

    const zakatStats = useMemo(() => {
        if (zakatTarget <= 0) return null;

        const currentYear = new Date().getFullYear();
        const zakatCategoryIds = categories
            .filter(c => c.name.toLowerCase().includes("zakat"))
            .map(c => c.id);

        const paid = expenses
            .filter(e => {
                const isZakat = zakatCategoryIds.includes(e.category_id);
                if (!isZakat) return false;
                const expenseDate = typeof e.date === 'string' ? parseLocalDate(e.date) : e.date;
                return expenseDate.getFullYear() === currentYear;
            })
            .reduce((acc, curr) => acc + curr.amount, 0);

        const progress = Math.min(100, (paid / zakatTarget) * 100);
        const remaining = Math.max(0, zakatTarget - paid);

        return { paid, progress, remaining, currentYear };
    }, [expenses, categories, zakatTarget]);

    return (
        <div className="relative h-full">
            <motion.div
                initial={{ opacity: 0, rotate: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, rotate: -15, scale: 1 }}
                whileHover={{ scale: 1.05, rotate: -10, opacity: 0.15 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute -bottom-8 -right-8 pointer-events-none"
            >
                <Wallet className="h-48 w-48 md:h-64 md:w-64" />
            </motion.div>

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[300px]">
                <div className="flex flex-row justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <h3 className="text-xl md:text-2xl font-bold text-black/40 dark:text-white/40 tracking-tight truncate">{greeting}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white/50 border-none px-3 py-1.5 backdrop-blur-md whitespace-nowrap text-[10px] md:text-xs">
                                {filteredCount === accounts.length
                                    ? "Net Balance"
                                    : filteredCount === 0
                                        ? "No Selection"
                                        : filteredCount === 1
                                            ? filteredAccounts[0]?.name
                                            : `${filteredCount} Accounts`}
                            </Badge>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <motion.button
                                        whileHover={{ rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                                    >
                                        <Settings2 className="h-4 w-4 opacity-40 hover:opacity-100" />
                                    </motion.button>
                                </DialogTrigger>
                                <DialogContent className="w-[90%] sm:max-w-[350px] rounded-[2rem] overflow-hidden">
                                    <DialogHeader>
                                        <DialogTitle>Filter Cash Balance</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3 pt-4">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Select Accounts to Include</p>
                                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {accounts.map((acc) => {
                                                const isSelected = selectedAccountIds.includes(acc.id);
                                                return (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => toggleAccount(acc.id)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 text-left group",
                                                            isSelected
                                                                ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(255,165,0,0.05)]"
                                                                : "bg-gray-100 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={cn(
                                                                "font-bold text-sm",
                                                                isSelected ? "text-primary" : "text-foreground"
                                                            )}>{acc.name}</span>
                                                            <span className="text-xs opacity-50 font-medium">{currencySymbol}{Number(acc.balance).toLocaleString()}</span>
                                                        </div>
                                                        <div className={cn(
                                                            "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                                            isSelected ? "bg-primary text-white scale-110" : "bg-gray-200 dark:bg-white/10 text-transparent"
                                                        )}>
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2 mt-2 pt-4 border-t border-gray-100 dark:border-white/10">
                                            <Button
                                                variant="ghost"
                                                className="flex-1 rounded-2xl text-xs font-bold hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                onClick={() => setSelectedAccountIds([])}
                                            >
                                                Clear All
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                className="flex-1 rounded-2xl text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                                onClick={() => setSelectedAccountIds(accounts.map(a => a.id))}
                                            >
                                                Select All
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                                className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                                title={isBalanceVisible ? "Hide Balance" : "Show Balance"}
                            >
                                {isBalanceVisible ? (
                                    <Eye className="h-4 w-4 opacity-40 hover:opacity-100" />
                                ) : (
                                    <EyeOff className="h-4 w-4 opacity-40 hover:opacity-100" />
                                )}
                            </motion.button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={displayBalance + (isBalanceVisible ? "visible" : "hidden")}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="text-3xl md:text-6xl font-bold mt-6 tracking-tight text-black dark:text-white break-words"
                            >
                                {isBalanceVisible ? (
                                    <>
                                        {currencySymbol}{displayBalance.toLocaleString()}
                                        <span className="text-lg md:text-2xl font-medium opacity-60 ml-2">.00</span>
                                    </>
                                ) : (
                                    <>
                                        {currencySymbol}••••••
                                    </>
                                )}
                            </motion.h2>
                        </AnimatePresence>
                    </div>
                    {/* Floating Action Button for Mobile / Desktop */}
                    <div className="shrink-0 z-20">
                        {children}
                    </div>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-6 mt-auto relative z-10 pb-2">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="flex flex-col min-w-[100px] sm:min-w-[120px]">
                            <span className="text-[10px] sm:text-sm font-medium opacity-60 text-black dark:text-white uppercase tracking-wider">Selected</span>
                            <span className="text-base sm:text-xl font-bold text-black dark:text-white mt-0.5 sm:mt-1">
                                {filteredCount} / {accounts.length} Accounts
                            </span>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-black/10 dark:bg-white/10" />
                        <div className="flex flex-col min-w-[100px] sm:min-w-[120px]">
                            <span className="text-[10px] sm:text-sm font-medium opacity-60 text-black dark:text-white uppercase tracking-wider">Total Net</span>
                            <span className="text-base sm:text-xl font-bold text-black dark:text-white mt-0.5 sm:mt-1">
                                {isBalanceVisible ? `${currencySymbol}${accounts.reduce((sum, acc) => sum + Number(acc.balance), 0).toLocaleString()}` : `${currencySymbol}••••`}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 self-end">
                        {/* Zakat Circular Progress (Pie Chart style) */}
                        {zakatStats && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group/zakat relative cursor-pointer"
                                onClick={() => {
                                    const url = new URL(window.location.href);
                                    url.searchParams.set("tab", "zakat");
                                    window.history.pushState({}, "", url.toString());
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                            >
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center justify-center gap-4 px-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Zakat {zakatStats.currentYear}</span>
                                    </div>
                                    <div className="relative h-[82px] w-[82px] sm:h-[104px] sm:w-[104px] flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                            {/* Background Circle */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                className="text-black/5 dark:text-white/5"
                                            />
                                            {/* Progress Circle with Glow */}
                                            <motion.circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="transparent"
                                                stroke="#10b981" // emerald-500
                                                strokeWidth="12"
                                                strokeDasharray="263.89"
                                                strokeDashoffset={263.89 - (263.89 * zakatStats.progress) / 100}
                                                strokeLinecap="round"
                                                initial={{ strokeDashoffset: 263.89 }}
                                                animate={{ strokeDashoffset: 263.89 - (263.89 * zakatStats.progress) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                {Math.round(zakatStats.progress)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/zakat:opacity-100 transition-all duration-300 z-[100] translate-y-1 group-hover/zakat:translate-y-0">
                                    <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-1.5 px-2.5 rounded-lg shadow-2xl flex flex-col items-center min-w-[100px] border border-white/10 dark:border-black/5">
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-0.5">Remaining</span>
                                        <span className="text-[11px] font-black whitespace-nowrap">
                                            {currencySymbol}{zakatStats.remaining.toLocaleString()}
                                        </span>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Minimal Grid Heatmap (Bottom Right) */}
                        <div className="shrink-0 group/heatmap transition-all duration-300">
                            <SpendingHeatmap expenses={expenses} currencySymbol={currencySymbol} variant="minimal" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
