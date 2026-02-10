"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    PieChart,
    ArrowUpRight,
    TrendingDown,
    AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

interface BudgetSummaryCardProps {
    income: number;
    spent: number;
    categories: any[];
    month: string;
    currencySymbol: string;
}

export function BudgetSummaryCard({ income, spent, categories, month, currencySymbol }: BudgetSummaryCardProps) {
    const spendingCategories = useMemo(() => {
        return categories
            .filter(cat => (cat.spent || 0) > 0)
            .sort((a, b) => b.spent - a.spent);
    }, [categories]);

    const isOverspent = spent > income && income > 0;

    return (
        <Card className="border-none shadow-xl bg-white dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden flex flex-col group/card h-fit">
            <CardContent className="p-5 flex flex-col relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover/card:opacity-[0.05] transition-opacity pointer-events-none">
                    <PieChart className="h-16 w-16 rotate-12" />
                </div>

                {/* Compact Header */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                            <PieChart className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">Summary of {month}</h3>
                    </div>
                    {income > 0 && (
                        <div className={cn(
                            "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            isOverspent
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                            {isOverspent ? "Overspending" : "Within Income"}
                        </div>
                    )}
                </div>

                {/* Scrollable Categories Area */}
                <div className="relative z-10 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Category Spending</h4>
                        {spendingCategories.length > 0 && (
                            <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/30">{spendingCategories.length} categories</span>
                        )}
                    </div>

                    <div className={cn(
                        "overflow-y-auto pr-1 custom-scrollbar space-y-1.5",
                        spendingCategories.length > 0 ? "max-h-[160px]" : "h-auto"
                    )}>
                        {spendingCategories.length > 0 ? (
                            spendingCategories.map((cat) => {
                                const percentageOfTotal = (cat.spent / spent) * 100;
                                return (
                                    <div key={cat.id} className="flex flex-col p-2 rounded-xl transition-all border bg-gray-50/50 dark:bg-white/[0.02] border-transparent">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="h-6 w-6 shrink-0 rounded flex items-center justify-center bg-primary/10 text-primary">
                                                    <DynamicIcon name={cat.icon || "Archive"} className="h-3 w-3" />
                                                </div>
                                                <p className="text-[10px] font-bold truncate opacity-80">{cat.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-muted-foreground">
                                                    {currencySymbol}{cat.spent.toLocaleString()}
                                                    <span className="opacity-40 font-bold ml-1">({Math.round(percentageOfTotal)}%)</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
                                                className="h-full rounded-full bg-primary/60"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center gap-2 px-4 py-8 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-gray-200/50 dark:border-white/10">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">No spending data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mini Footer Stats */}
                <div className="pt-4 border-t border-dashed border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/40 mb-0.5">Income</span>
                        <p className="text-lg font-black tracking-tighter leading-none">{currencySymbol}{income.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-red-500/40 mb-0.5">Spent</span>
                        <p className="text-lg font-black tracking-tighter leading-none">{currencySymbol}{spent.toLocaleString()}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
