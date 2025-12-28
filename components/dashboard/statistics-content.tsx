"use client";

import { useMemo } from "react";
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
import { AIInsights } from "./ai-insights";

interface StatisticsContentProps {
    expenses: any[];
    categories: any[];
    currencySymbol?: string;
}

export function StatisticsContent({ expenses, categories, currencySymbol = "$" }: StatisticsContentProps) {
    const stats = useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return {
                sortedCategories: [],
                totalExpense: 0,
                currentStreak: 0,
                longestStreak: 0,
                weeklyData: Array.from({ length: 7 }).map((_, i) => ({
                    day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
                    amount: 0,
                    date: ""
                })),
                maxWeekly: 1
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
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // Current Streak
            let checkDate = dates[0] === today || dates[0] === yesterday ? dates[0] : null;
            if (checkDate) {
                currentStreak = 1;
                for (let i = 1; i < dates.length; i++) {
                    const d1 = new Date(dates[i - 1]);
                    const d2 = new Date(dates[i]);
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
                    const d1 = new Date(dates[i - 1]);
                    const d2 = new Date(dates[i]);
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
            const dateStr = d.toISOString().split('T')[0];
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

        return {
            sortedCategories,
            totalExpense,
            currentStreak,
            longestStreak,
            weeklyData,
            maxWeekly
        };
    }, [expenses]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Row: Streaks & Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-orange-500 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                        <Flame className="h-32 w-32" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-white/20 border-none text-white">Daily Streak</Badge>
                        </div>
                        <h3 className="text-4xl font-black">{stats.currentStreak} Days</h3>
                        <p className="text-white/70 text-sm mt-1 font-medium italic">You're on fire! Keep tracking daily.</p>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-600 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                        <Trophy className="h-32 w-32" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-white/20 border-none text-white">All Time Best</Badge>
                        </div>
                        <h3 className="text-4xl font-black">{stats.longestStreak} Days</h3>
                        <p className="text-white/70 text-sm mt-1 font-medium italic">Your record for consistent logging.</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-600 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                        <Target className="h-32 w-32" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-white/20 border-none text-white">Reliability Score</Badge>
                        </div>
                        <h3 className="text-4xl font-black">
                            {expenses.length > 0 ? Math.min(100, Math.round((stats.currentStreak / 30) * 100)) : 0}%
                        </h3>
                        <p className="text-white/70 text-sm mt-1 font-medium italic">Consistency over the last 30 days.</p>
                    </CardContent>
                </Card>
            </div>

            {/* AI Insights Section */}
            <AIInsights
                expenses={expenses}
                categories={categories}
                currencySymbol={currencySymbol}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Spending by Category (Left 7) */}
                <Card className="lg:col-span-12 border-none shadow-sm dark:bg-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Spending Distribution
                        </CardTitle>
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
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                                    i === 0 ? "bg-primary" : "bg-primary/40"
                                                )}
                                                style={{ width: `${(cat.amount / stats.totalExpense) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Weekly Trend Visual */}
                            <div className="bg-gray-50/50 dark:bg-black/40 rounded-[2.5rem] p-8 border border-gray-100/50 dark:border-white/5 shadow-inner">
                                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-10 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Weekly Activity
                                </h4>
                                <div className="flex items-end justify-between h-48 gap-3">
                                    {stats.weeklyData.map((day) => (
                                        <div key={day.date} className="flex-1 flex flex-col items-center gap-4 group/bar h-full">
                                            <div className="relative w-full flex justify-center items-end h-full">
                                                {/* Premium Bar */}
                                                <div
                                                    className={cn(
                                                        "w-full rounded-t-2xl transition-all duration-500 cursor-pointer relative",
                                                        day.amount === stats.maxWeekly
                                                            ? "bg-gradient-to-t from-primary to-orange-400 shadow-[0_-10px_30px_-10px_rgba(255,165,0,0.5)]"
                                                            : "bg-gray-200 dark:bg-white/10 group-hover/bar:bg-primary/40"
                                                    )}
                                                    style={{ height: `${Math.max((day.amount / stats.maxWeekly) * 100, 5)}%` }}
                                                >
                                                    {/* Hover Glow */}
                                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-2xl" />
                                                </div>

                                                {/* Floating Tooltip */}
                                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/bar:opacity-100 group-hover/bar:-top-16 transition-all duration-300 z-50">
                                                    <div className="bg-black/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-black py-2 px-3 rounded-xl shadow-2xl flex flex-col items-center">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Spent</span>
                                                        <span className="text-sm font-black whitespace-nowrap">{currencySymbol}{day.amount.toLocaleString()}</span>
                                                        {/* Arrow */}
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 dark:bg-white/90 rotate-45" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black transition-all",
                                                day.amount === stats.maxWeekly ? "text-primary opacity-100" : "opacity-30 group-hover/bar:opacity-100"
                                            )}>
                                                {day.day}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Fun Facts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm dark:bg-white/5 p-8 flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <TrendingDown className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="font-black text-xl">Top Category</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your biggest spending is on <span className="text-primary font-bold">"{stats.sortedCategories[0]?.name || 'N/A'}"</span>.
                            This accounts for <span className="font-bold">{((stats.sortedCategories[0]?.amount || 0) / (stats.totalExpense || 1) * 100).toFixed(1)}%</span> of your total journals.
                        </p>
                    </div>
                </Card>

                <Card className="border-none shadow-sm dark:bg-white/5 p-8 flex items-center gap-6 text-right justify-end">
                    <div>
                        <h4 className="font-black text-xl">Consistency</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            You've recorded <span className="text-primary font-bold">{expenses.length}</span> journals so far.
                            Keep it up to unlock deeper financial intelligence!
                        </p>
                    </div>
                    <div className="h-16 w-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Calendar className="h-8 w-8" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
