"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    TrendingDown,
    Zap,
    Flame,
    Calendar,
    Target,
    Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLocalDate, parseLocalDate } from "@/lib/date-utils";
import { AIInsights } from "./ai-insights";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface StatisticsContentProps {
    expenses: any[];
    categories: any[];
    currencySymbol?: string;
}

const containerVariants: Variants = {
    visible: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

export function StatisticsContent({ expenses, categories, currencySymbol = "$" }: StatisticsContentProps) {
    // Time period filter state with localStorage persistence
    const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'yearly'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('statsTimePeriod');
            return (saved as 'weekly' | 'monthly' | 'yearly') || 'weekly';
        }
        return 'weekly';
    });

    // Save time period to localStorage
    useEffect(() => {
        localStorage.setItem('statsTimePeriod', timePeriod);
    }, [timePeriod]);

    const stats = useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return {
                sortedCategories: [],
                totalExpense: 0,
                currentStreak: 0,
                longestStreak: 0,
                weeklyData: Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        amount: 0,
                        date: formatLocalDate(d)
                    };
                }),
                monthlyData: Array.from({ length: 30 }).map((_, i) => ({
                    day: (i + 1).toString(),
                    amount: 0,
                    date: ""
                })),
                yearlyData: Array.from({ length: 12 }).map((_, i) => ({
                    day: new Date(0, i).toLocaleDateString('en-US', { month: 'short' }),
                    amount: 0,
                    date: ""
                })),
                maxWeekly: 1,
                maxMonthly: 1,
                maxYearly: 1
            };
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Category Distribution
        const categoryMap: Record<string, number> = {};
        expenses.filter(e => e.type === 'expense').forEach(e => {
            const catName = e.categories?.name || 'Uncategorized';
            categoryMap[catName] = (categoryMap[catName] || 0) + Number(e.amount);
        });

        const sortedCategories = Object.entries(categoryMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        const totalExpense = sortedCategories.reduce((acc, curr) => acc + curr.amount, 0);

        // 2. Streaks Logic
        const dates = [...new Set(expenses.map(e => e.date))].sort().reverse();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        if (dates.length > 0) {
            const today = formatLocalDate();
            const yesterday = formatLocalDate(new Date(Date.now() - 86400000));

            // Current Streak
            let checkDate = dates[0] === today || dates[0] === yesterday ? dates[0] : null;
            if (checkDate) {
                currentStreak = 1;
                for (let i = 1; i < dates.length; i++) {
                    const d1 = parseLocalDate(dates[i - 1]);
                    const d2 = parseLocalDate(dates[i]);
                    const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            // Longest Streak
            for (let i = 0; i < dates.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const d1 = parseLocalDate(dates[i - 1]);
                    const d2 = parseLocalDate(dates[i]);
                    const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
                    if (diff === 1) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        // 3. Weekly Activity (Last 7 days)
        const weeklyData = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = formatLocalDate(d);
            const dayAmount = expenses
                .filter(e => e.date === dateStr && e.type === 'expense')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);
            return {
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: dayAmount,
                date: dateStr
            };
        });

        const maxWeekly = Math.max(...weeklyData.map(d => d.amount), 1);

        // 4. Monthly Data (Last 30 days)
        const monthlyData = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const dateStr = formatLocalDate(d);
            const dayAmount = expenses
                .filter(e => e.date === dateStr && e.type === 'expense')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);
            return {
                day: d.getDate().toString(),
                amount: dayAmount,
                date: dateStr
            };
        });

        const maxMonthly = Math.max(...monthlyData.map(d => d.amount), 1);

        // 5. Yearly Data (Last 12 months)
        const yearlyData = Array.from({ length: 12 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (11 - i));
            const year = d.getFullYear();
            const month = d.getMonth();
            const monthAmount = expenses
                .filter(e => {
                    const expDate = parseLocalDate(e.date);
                    return expDate.getFullYear() === year && expDate.getMonth() === month && e.type === 'expense';
                })
                .reduce((acc, curr) => acc + Number(curr.amount), 0);
            return {
                day: d.toLocaleDateString('en-US', { month: 'short' }),
                amount: monthAmount,
                date: `${year}-${(month + 1).toString().padStart(2, '0')}`
            };
        });

        const maxYearly = Math.max(...yearlyData.map(d => d.amount), 1);

        return {
            sortedCategories,
            totalExpense,
            currentStreak,
            longestStreak,
            weeklyData,
            monthlyData,
            yearlyData,
            maxWeekly,
            maxMonthly,
            maxYearly
        };
    }, [expenses]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Top Row: Streaks & Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants}>
                    <Card className="bg-blue-500 text-white border-none shadow-xl relative overflow-hidden group h-full">
                        <motion.div
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none"
                        >
                            <Flame className="h-32 w-32" />
                        </motion.div>
                        <CardContent className="p-4 sm:p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-white/20 border-none text-white">Daily Streak</Badge>
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black">{stats.currentStreak} Days</h3>
                            <p className="text-white/70 text-xs sm:text-sm mt-1 font-medium italic">You're on fire! Keep tracking daily.</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="bg-indigo-600 text-white border-none shadow-xl relative overflow-hidden group h-full">
                        <motion.div
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none"
                        >
                            <Trophy className="h-32 w-32" />
                        </motion.div>
                        <CardContent className="p-4 sm:p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-white/20 border-none text-white">All Time Best</Badge>
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black">{stats.longestStreak} Days</h3>
                            <p className="text-white/70 text-xs sm:text-sm mt-1 font-medium italic">Your record for consistent logging.</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="bg-emerald-600 text-white border-none shadow-xl relative overflow-hidden group h-full">
                        <motion.div
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none"
                        >
                            <Target className="h-32 w-32" />
                        </motion.div>
                        <CardContent className="p-4 sm:p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-white/20 border-none text-white">Reliability Score</Badge>
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black">
                                {expenses.length > 0 ? Math.min(100, Math.round((stats.currentStreak / 30) * 100)) : 0}%
                            </h3>
                            <p className="text-white/70 text-xs sm:text-sm mt-1 font-medium italic">Consistency over the last 30 days.</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* AI Insights Section */}
            <motion.div variants={itemVariants}>
                <AIInsights
                    expenses={expenses}
                    categories={categories}
                    currencySymbol={currencySymbol}
                />
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="border-none shadow-sm dark:bg-white/5">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Spending Distribution
                        </CardTitle>
                        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl">
                            {['weekly', 'monthly', 'yearly'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setTimePeriod(p as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden",
                                        timePeriod === p
                                            ? "text-white"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {timePeriod === p && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-primary shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{p}</span>
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            {/* Visual Bars */}
                            <div className="space-y-6">
                                {stats.sortedCategories.slice(0, 5).map((cat, i) => (
                                    <div key={cat.name} className="space-y-2 group">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{cat.name}</span>
                                            <span className="font-black text-lg">{currencySymbol}{cat.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(cat.amount / stats.totalExpense) * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 + (i * 0.1) }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    i === 0 ? "bg-primary" : "bg-primary/40"
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Weekly Trend Visual */}
                            <div className="bg-gray-50/50 dark:bg-black/40 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 border border-gray-100/50 dark:border-white/5 shadow-inner overflow-hidden">
                                <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest opacity-40 mb-10 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {timePeriod === 'weekly' ? 'Weekly Activity' : timePeriod === 'monthly' ? 'Monthly Activity (30 Days)' : 'Yearly Activity (12 Months)'}
                                </h4>
                                <div className={cn(
                                    "flex items-end justify-between h-48",
                                    timePeriod === 'weekly' ? "gap-3" : timePeriod === 'monthly' ? "gap-1" : "gap-2"
                                )}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={timePeriod}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-end justify-between w-full h-full"
                                        >
                                            {(timePeriod === 'weekly' ? stats.weeklyData : timePeriod === 'monthly' ? stats.monthlyData : stats.yearlyData).map((day, dIdx) => {
                                                const maxValue = timePeriod === 'weekly' ? stats.maxWeekly : timePeriod === 'monthly' ? stats.maxMonthly : stats.maxYearly;
                                                const isMax = day.amount === maxValue;
                                                return (
                                                    <div key={day.date} className="flex-1 flex flex-col items-center gap-4 group/bar h-full">
                                                        <div className="relative w-full flex justify-center items-end h-full">
                                                            {/* Premium Bar */}
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${Math.max((day.amount / maxValue) * 100, 5)}%` }}
                                                                transition={{ delay: dIdx * 0.02, type: "spring", stiffness: 100, damping: 15 }}
                                                                className={cn(
                                                                    "w-full rounded-t-2xl cursor-pointer relative",
                                                                    isMax
                                                                        ? "bg-gradient-to-t from-primary to-blue-300 shadow-[0_-10px_30px_-10px_rgba(37,99,235,0.5)]"
                                                                        : "bg-gray-200 dark:bg-white/10 group-hover/bar:bg-primary/40"
                                                                )}
                                                            >
                                                                {/* Hover Glow */}
                                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-2xl" />
                                                            </motion.div>

                                                            {/* Floating Tooltip */}
                                                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/bar:opacity-100 group-hover/bar:-top-16 transition-all duration-300 z-50">
                                                                <div className="bg-black/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-black py-2 px-3 rounded-xl shadow-2xl flex flex-col items-center">
                                                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Spent</span>
                                                                    <span className="text-sm font-black whitespace-nowrap">{currencySymbol}{day.amount.toLocaleString()}</span>
                                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 dark:bg-white/90 rotate-45" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] font-black transition-all",
                                                            isMax ? "text-primary opacity-100" : "opacity-30 group-hover/bar:opacity-100"
                                                        )}>
                                                            {day.day}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bottom Row: Fun Facts - Commented out as requested */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <Card className="border-none shadow-sm dark:bg-white/5 p-4 sm:p-8 flex items-center gap-4 sm:gap-6 h-full group hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: -10 }}
                            className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"
                        >
                            <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8" />
                        </motion.div>
                        <div>
                            <h4 className="font-black text-lg sm:text-xl">Top Category</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Your biggest spending is on <span className="text-primary font-bold">"{stats.sortedCategories[0]?.name || 'N/A'}"</span>.
                                This accounts for <span className="font-bold">{((stats.sortedCategories[0]?.amount || 0) / (stats.totalExpense || 1) * 100).toFixed(1)}%</span> of your total journals.
                            </p>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="border-none shadow-sm dark:bg-white/5 p-4 sm:p-8 flex items-center gap-4 sm:gap-6 text-right justify-end h-full group hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                        <div>
                            <h4 className="font-black text-lg sm:text-xl">Consistency</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                You've recorded <span className="text-primary font-bold">{expenses.length}</span> journals so far.
                                Keep it up to unlock deeper financial intelligence!
                            </p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0"
                        >
                            <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
                        </motion.div>
                    </Card>
                </motion.div>
            </div> */}
        </motion.div>
    );
}
