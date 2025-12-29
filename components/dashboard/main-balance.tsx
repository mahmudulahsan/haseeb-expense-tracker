"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings2, CheckCircle2, Circle } from "lucide-react";
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

interface MainBalanceProps {
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol?: string;
    children: React.ReactNode; // For the AddTransactionDialog
}

export function MainBalance({ accounts, categories, greeting, currencySymbol = "$", children }: MainBalanceProps) {
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

    // Save to localStorage whenever selection changes
    useEffect(() => {
        localStorage.setItem('selectedAccountIds', JSON.stringify(selectedAccountIds));
    }, [selectedAccountIds]);

    const toggleAccount = (id: string) => {
        setSelectedAccountIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const displayBalance = useMemo(() => {
        return accounts
            .filter((acc) => selectedAccountIds.includes(acc.id))
            .reduce((sum, acc) => sum + Number(acc.balance), 0);
    }, [accounts, selectedAccountIds]);

    const activeAccountNames = accounts
        .filter((acc) => selectedAccountIds.includes(acc.id))
        .map((acc) => acc.name)
        .join(", ");

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
                                {selectedAccountIds.length === accounts.length
                                    ? "Net Balance"
                                    : selectedAccountIds.length === 0
                                        ? "No Selection"
                                        : selectedAccountIds.length === 1
                                            ? activeAccountNames
                                            : `${selectedAccountIds.length} Accounts`}
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
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={displayBalance}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="text-3xl md:text-6xl font-bold mt-6 tracking-tight text-black dark:text-white break-words"
                            >
                                {currencySymbol}{displayBalance.toLocaleString()}
                                <span className="text-lg md:text-2xl font-medium opacity-60 ml-2">.00</span>
                            </motion.h2>
                        </AnimatePresence>
                    </div>
                    {/* Floating Action Button for Mobile / Desktop */}
                    <div className="shrink-0 z-20">
                        {children}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:flex items-center gap-6 mt-12 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium opacity-60 text-black dark:text-white uppercase tracking-wider">Selected</span>
                        <span className="text-xl font-bold text-black dark:text-white mt-1">
                            {selectedAccountIds.length} / {accounts.length} Accounts
                        </span>
                    </div>
                    <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium opacity-60 text-black dark:text-white uppercase tracking-wider">Total Net</span>
                        <span className="text-xl font-bold text-black dark:text-white mt-1">
                            {currencySymbol}{accounts.reduce((sum, acc) => sum + Number(acc.balance), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
