"use client";

import { useMemo, useState } from "react";
import { parseLocalDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SpendingHeatmapProps {
    expenses: any[];
    currencySymbol?: string;
    variant?: "default" | "minimal";
}

export function SpendingHeatmap({ expenses, currencySymbol = "$", variant = "default" }: SpendingHeatmapProps) {
    const [monthOffset, setMonthOffset] = useState(0);

    const heatmapData = useMemo(() => {
        const now = new Date();
        now.setMonth(now.getMonth() + monthOffset);

        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

        const dailySpending: Record<number, number> = {};
        for (let i = 1; i <= daysInMonth; i++) {
            dailySpending[i] = 0;
        }

        expenses.forEach(expense => {
            if (expense.type !== 'expense') return;
            // Handle both string and date object
            const expenseDate = typeof expense.date === 'string' ? parseLocalDate(expense.date) : expense.date;

            if (expenseDate.getFullYear() === year && expenseDate.getMonth() === month) {
                const day = expenseDate.getDate();
                dailySpending[day] += Number(expense.amount);
            }
        });

        const dataArray = Object.entries(dailySpending).map(([day, amount]) => ({
            day: parseInt(day),
            amount
        }));

        const maxAmount = Math.max(...dataArray.map(d => d.amount), 1);

        // Prepare full grid with leading empty days
        const grid = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push({ day: -i - 1, amount: -1 }); // Placeholder
        }
        dataArray.forEach(d => grid.push(d));

        // Always pad to 42 cells (6 weeks) to keep height consistent
        while (grid.length < 42) {
            grid.push({ day: -grid.length - 1, amount: -1 });
        }

        return {
            grid,
            maxAmount,
            daysInMonth,
            monthName: now.toLocaleDateString('en-US', { month: 'long' }),
            year
        };
    }, [expenses, monthOffset]);

    const getIntensity = (amount: number) => {
        if (amount < 0) return -1; // Placeholder
        if (amount === 0) return 0;
        const ratio = amount / heatmapData.maxAmount;
        if (ratio < 0.2) return 1;
        if (ratio < 0.4) return 2;
        if (ratio < 0.6) return 3;
        if (ratio < 0.8) return 4;
        return 5;
    };

    const getColorClass = (intensity: number) => {
        switch (intensity) {
            case -1: return "bg-transparent";
            case 0: return "bg-black/5 dark:bg-white/5";
            case 1: return "bg-primary/10 dark:bg-primary/20";
            case 2: return "bg-primary/25 dark:bg-primary/40";
            case 3: return "bg-primary/45 dark:bg-primary/60";
            case 4: return "bg-primary/65 dark:bg-primary/80";
            case 5: return "bg-primary";
            default: return "bg-black/5 dark:bg-white/5";
        }
    };

    if (variant === "minimal") {
        return (
            <div className="flex flex-col gap-2.5 self-end">
                <div className="flex items-center justify-between gap-4 px-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Activity</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMonthOffset(prev => prev - 1)}
                            className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                            <ChevronLeft className="h-3 w-3 opacity-40 hover:opacity-100" />
                        </button>
                        <div className="min-w-[70px] text-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={`${heatmapData.monthName}-${heatmapData.year}`}
                                    initial={{ y: 5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -5, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[9px] font-black uppercase tracking-tighter text-black/60 dark:text-white/60 block"
                                >
                                    {heatmapData.monthName.slice(0, 3)} {heatmapData.year}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => setMonthOffset(prev => prev + 1)}
                            className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                            <ChevronRight className="h-3 w-3 opacity-40 hover:opacity-100" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 p-1.5 bg-white/30 dark:bg-black/20 rounded-[10px] backdrop-blur-sm">
                    {heatmapData.grid.map((dayData, idx) => {
                        const intensity = getIntensity(dayData.amount);
                        if (intensity === -1) return <div key={`empty-${idx}`} className="w-2.5 h-2.5" />;

                        return (
                            <div key={dayData.day} className="group/sq relative">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: (idx % 35) * 0.005 }}
                                    className={cn(
                                        "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] transition-colors duration-300 cursor-help relative z-10",
                                        getColorClass(intensity)
                                    )}
                                />
                                {/* Premium Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/sq:opacity-100 transition-all duration-300 z-[100] translate-y-1 group-hover/sq:translate-y-0">
                                    <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-1 px-2 rounded-md shadow-2xl flex flex-col items-center min-w-[70px] border border-white/10 dark:border-black/5">
                                        <span className="text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                                            {heatmapData.monthName} {dayData.day}
                                        </span>
                                        <span className="text-[9px] font-black whitespace-nowrap">
                                            {currencySymbol}{dayData.amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60 dark:text-white/60">Spending Intensity</h3>
                    <p className="text-[9px] font-bold text-black/30 dark:text-white/30 mt-0.5">{heatmapData.monthName} Overview</p>
                </div>
                <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-[1.5px] transition-colors duration-500",
                                getColorClass(i)
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-1 items-center relative z-20">
                {heatmapData.grid.map((dayData, idx) => {
                    const intensity = getIntensity(dayData.amount);
                    if (intensity === -1) return null; // No placeholders in horizontal view

                    return (
                        <div key={dayData.day} className="group/sq relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: dayData.day * 0.005 }}
                                className={cn(
                                    "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] transition-all duration-300 hover:scale-125 cursor-help relative z-10",
                                    getColorClass(intensity)
                                )}
                            />
                            {/* Premium Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/sq:opacity-100 transition-all duration-300 z-[100] translate-y-1 group-hover/sq:translate-y-0">
                                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-1.5 px-2.5 rounded-lg shadow-2xl flex flex-col items-center min-w-[80px] border border-white/10 dark:border-black/5">
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                                        {heatmapData.monthName.slice(0, 3)} {dayData.day}
                                    </span>
                                    <span className="text-[11px] font-black whitespace-nowrap">
                                        {currencySymbol}{dayData.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
