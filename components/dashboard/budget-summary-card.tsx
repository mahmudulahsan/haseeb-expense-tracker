"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Target,
    ArrowUpRight,
    TrendingDown,
    AlertCircle,
    Settings,
    Pencil,
    X,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { CategoryTargetsDialog } from "@/components/dashboard/category-targets-dialog";
import { updateCategoryTarget } from "@/app/actions/finance";
import { toast } from "sonner";
import { useState } from "react";

interface BudgetSummaryCardProps {
    income: number;
    spent: number;
    categories: any[];
    month: string;
    currencySymbol: string;
}

export function BudgetSummaryCard({ income, spent, categories, month, currencySymbol }: BudgetSummaryCardProps) {
    const totalTarget = useMemo(() => {
        return categories.reduce((sum, cat) => sum + (cat.monthly_target || 0), 0);
    }, [categories]);

    const targetCategories = useMemo(() => {
        return categories
            .filter(cat => (cat.monthly_target || 0) > 0)
            .sort((a, b) => {
                const aRatio = a.spent / a.monthly_target;
                const bRatio = b.spent / b.monthly_target;
                return bRatio - aRatio; // Highlight highest utilization first
            });
    }, [categories]);

    const trackedSpent = useMemo(() => {
        return targetCategories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    }, [targetCategories]);

    const percentage = totalTarget > 0 ? (trackedSpent / totalTarget) * 100 : 0;
    const isOverBudget = trackedSpent > totalTarget && totalTarget > 0;
    const remaining = totalTarget - trackedSpent;

    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleRemoveTarget = async (categoryId: string) => {
        setRemovingId(categoryId);
        const res = await updateCategoryTarget(categoryId, 0);
        if (res.success) {
            toast.success("Target removed");
        } else {
            toast.error("Failed to remove target");
        }
        setRemovingId(null);
    };

    return (
        <Card className="border-none shadow-xl bg-white dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden flex flex-col group/card h-fit">
            <CardContent className="p-5 flex flex-col relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-3 opacity-[0.02] group-hover/card:opacity-[0.05] transition-opacity pointer-events-none">
                    <Target className="h-16 w-16 rotate-12" />
                </div>

                {/* Compact Header */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                            <Target className="h-4 w-4" />
                        </div>
                        <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">Targets of {month}</h3>
                    </div>
                    <div className="flex items-center gap-2 relative z-20">
                        <CategoryTargetsDialog
                            categories={categories}
                            currencySymbol={currencySymbol}
                            trigger={
                                <button className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-95 border border-transparent hover:border-primary/20">
                                    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
                                        <Settings className="h-3.5 w-3.5" />
                                    </motion.div>
                                </button>
                            }
                        />
                        {totalTarget > 0 && (
                            <div className={cn(
                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                isOverBudget
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                                {isOverBudget ? "Reduction needed" : "Healthy"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Stats Row */}
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div className="space-y-0.5">
                        <p className="text-2xl font-black tracking-tighter leading-none">
                            {totalTarget > 0 ? `${Math.round(percentage)}%` : `${currencySymbol}${spent.toLocaleString()}`}
                        </p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Utilization</p>
                    </div>
                    {totalTarget > 0 && (
                        <div className="text-right space-y-0.5">
                            <p className={cn("text-base font-black tracking-tighter leading-none", isOverBudget ? "text-red-500" : "text-emerald-500")}>
                                {remaining < 0 && "-"} {currencySymbol}{Math.abs(remaining).toLocaleString()}
                            </p>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Balance</p>
                        </div>
                    )}
                </div>

                {/* Main Progress Bar (Minimal) */}
                <div className="mb-4 relative z-10">
                    {totalTarget > 0 && (
                        <div className="relative h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200/30 dark:border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(percentage, 100)}%` }}
                                className={cn(
                                    "h-full rounded-full relative",
                                    isOverBudget ? "bg-red-500" : percentage > 85 ? "bg-amber-500" : "bg-emerald-500"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Scrollable Categories Area */}
                <div className="relative z-10 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Category Targets</h4>
                        {targetCategories.length > 0 && (
                            <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/30">{targetCategories.length} tracked</span>
                        )}
                    </div>

                    <div className={cn(
                        "overflow-y-auto pr-1 custom-scrollbar space-y-1.5",
                        targetCategories.length > 0 ? "max-h-[140px]" : "h-auto"
                    )}>
                        {targetCategories.length > 0 ? (
                            targetCategories.map((cat) => {
                                const catPercentage = (cat.spent / cat.monthly_target) * 100;
                                const catIsOver = cat.spent > cat.monthly_target;
                                return (
                                    <div key={cat.id} className={cn(
                                        "flex flex-col p-2 rounded-xl transition-all border",
                                        catIsOver
                                            ? "bg-red-500/[0.03] border-red-500/10"
                                            : "bg-gray-50/50 dark:bg-white/[0.02] border-transparent"
                                    )}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={cn(
                                                    "h-6 w-6 shrink-0 rounded flex items-center justify-center",
                                                    catIsOver ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                                                )}>
                                                    <DynamicIcon name={cat.icon || "Archive"} className="h-3 w-3" />
                                                </div>
                                                <p className="text-[10px] font-black truncate opacity-80">{cat.name}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="text-right">
                                                    <p className={cn("text-[9px] font-black", catIsOver ? "text-red-500" : "text-muted-foreground")}>
                                                        {currencySymbol}{cat.spent.toLocaleString()}
                                                        <span className="opacity-40 font-bold ml-1">/ {cat.monthly_target.toLocaleString()}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    <CategoryTargetsDialog
                                                        categories={categories}
                                                        currencySymbol={currencySymbol}
                                                        initialCategoryId={cat.id}
                                                        trigger={
                                                            <button className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all">
                                                                <motion.div whileHover={{ scale: 1.2 }}>
                                                                    <Pencil className="h-2.5 w-2.5" />
                                                                </motion.div>
                                                            </button>
                                                        }
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveTarget(cat.id)}
                                                        disabled={removingId === cat.id}
                                                        className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/5 transition-all ml-0.5"
                                                    >
                                                        {removingId === cat.id ? (
                                                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                        ) : (
                                                            <X className="h-2.5 w-2.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(catPercentage, 100)}%` }}
                                                className={cn(
                                                    "h-full rounded-full transition-colors",
                                                    catIsOver ? "bg-red-500" : catPercentage > 85 ? "bg-amber-500" : "bg-emerald-500"
                                                )}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-indigo-50/50 dark:bg-white/[0.02] border border-dashed border-indigo-200/50 dark:border-white/10 group/empty hover:bg-indigo-50 dark:hover:bg-white/[0.04] transition-all duration-300">
                                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover/empty:scale-110">
                                    <Target className="h-4 w-4" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600/40">No budget target</p>
                                    <p className="text-[7px] font-bold text-muted-foreground/40 leading-tight max-w-[150px]">Set a goal to start tracking category spending</p>
                                </div>
                                <CategoryTargetsDialog
                                    categories={categories}
                                    currencySymbol={currencySymbol}
                                    trigger={
                                        <button className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all">
                                            Setup Targets
                                        </button>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Mini Footer Stats */}
                <div className="pt-4 border-t border-dashed border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/40 mb-0.5">Income</span>
                        <p className="text-lg font-black tracking-tighter leading-none">{currencySymbol}{income.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[8px] font-black uppercase tracking-widest text-red-500/40 mb-0.5">Spent</span>
                        <p className="text-lg font-black tracking-tighter leading-none">{currencySymbol}{spent.toLocaleString()}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
