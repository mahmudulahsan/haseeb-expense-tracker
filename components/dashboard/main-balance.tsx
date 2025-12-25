"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ... imports

interface MainBalanceProps {
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol?: string;
    children: React.ReactNode; // For the AddTransactionDialog
}

export function MainBalance({ accounts, categories, greeting, currencySymbol = "$", children }: MainBalanceProps) {
    // By default, all accounts are selected
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
        accounts.map((acc) => acc.id)
    );

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
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Wallet className="h-48 w-48 rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[300px]">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-black/40 dark:text-white/40 tracking-tight">{greeting}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white/50 border-none px-4 py-1.5 backdrop-blur-md max-w-[200px] truncate">
                                {selectedAccountIds.length === accounts.length
                                    ? "Net Balance"
                                    : selectedAccountIds.length === 0
                                        ? "No Selection"
                                        : activeAccountNames}
                            </Badge>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="p-1.5 rounded-full hover:bg-black/5 transition-colors">
                                        <Settings2 className="h-4 w-4 opacity-40 hover:opacity-100" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[350px]">
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

                        <h2 className="text-6xl font-bold mt-6 tracking-tight text-black dark:text-white">
                            {currencySymbol}{displayBalance.toLocaleString()}
                            <span className="text-2xl font-medium opacity-60 ml-2">.00</span>
                        </h2>
                    </div>
                    {children}
                </div>

                <div className="flex items-center gap-6 mt-12">
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
