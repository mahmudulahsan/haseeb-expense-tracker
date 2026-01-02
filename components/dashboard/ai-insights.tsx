"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Heart,
    Zap,
    TrendingDown,
    Lightbulb,
    Target,
    Star,
    Shield,
    Wallet,
    Loader2,
    RefreshCw,
    Lock
} from "lucide-react";
import { generateInsights } from "@/app/actions/finance";
import { cn } from "@/lib/utils";
import { formatLocalDate, parseLocalDate } from "@/lib/date-utils";
import { motion } from "framer-motion";

const ICON_MAP: Record<string, any> = {
    Heart,
    Zap,
    TrendingDown,
    Lightbulb,
    Target,
    Star,
    Shield,
    Wallet
};

interface Insight {
    title: string;
    insight: string;
    type: "positive" | "warning" | "info";
    icon: string;
}

interface AIInsightsProps {
    expenses: any[];
    categories: any[];
    currencySymbol?: string;
}

export function AIInsights({ expenses, categories, currencySymbol = "$" }: AIInsightsProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = async (force: boolean = false) => {
        if (expenses.length < 10) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await generateInsights(expenses, categories, currencySymbol, force, formatLocalDate());
            if (result.success && result.insights) {
                setInsights(result.insights);
                setLastUpdated(result.lastUpdated);
            } else {
                setError(result.error || "Failed to load insights");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch insights on mount if not already fetched and has enough data
        if (expenses.length >= 10 && insights.length === 0) {
            fetchInsights();
        }
    }, [expenses.length]);

    if (expenses.length < 10) {
        return (
            <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 backdrop-blur-sm overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[100px] rounded-full" />

                <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                        <div className="relative z-10 bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-xl">
                            <Sparkles className="h-12 w-12 text-indigo-500 animate-pulse" />
                            <Lock className="h-5 w-5 text-indigo-600 absolute -top-1 -right-1" />
                        </div>
                    </div>

                    <div className="space-y-2 max-w-md">
                        <h3 className="text-2xl font-black">AI Insights Locked</h3>
                        <p className="text-muted-foreground font-medium">
                            To provide accurate and meaningful analysis, our AI needs at least <span className="text-indigo-500 font-bold">10 transactions</span> to understand your spending patterns.
                        </p>
                    </div>

                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-500/60">
                            <span>Progress</span>
                            <span>{expenses.length} / 10 Transactions</span>
                        </div>
                        <div className="h-3 w-full bg-indigo-500/10 rounded-full overflow-hidden p-0.5 border border-indigo-500/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((expenses.length / 10) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            />
                        </div>
                        <p className="text-[10px] font-bold text-indigo-500/40 uppercase tracking-widest">
                            {10 - expenses.length} more to go
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 backdrop-blur-sm overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[100px] rounded-full" />

            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl sm:text-2xl font-black flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
                        Smart AI Insights
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Personalized analysis of your spending behavior
                        </p>
                        {lastUpdated && (
                            <>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60">
                                    Updated {parseLocalDate(lastUpdated).toLocaleDateString()}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchInsights(true)}
                    disabled={isLoading}
                    className="rounded-full hover:bg-indigo-500/10 hover:text-indigo-600 transition-all active:scale-95"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Refresh</span>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading && insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-ping" />
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 relative z-10" />
                        </div>
                        <p className="text-sm font-bold text-indigo-500/60 uppercase tracking-widest animate-pulse">
                            Analyzing your journals...
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                        <Button variant="link" onClick={() => fetchInsights(true)} className="mt-2">Try Again</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {insights.map((insight, idx) => {
                            const Icon = ICON_MAP[insight.icon] || Lightbulb;
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "group p-6 rounded-[2rem] transition-all duration-500 hover:scale-[1.02] active:scale-95 cursor-default relative overflow-hidden border border-transparent hover:border-white/20 dark:hover:border-white/10",
                                        insight.type === "positive" ? "bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" :
                                            insight.type === "warning" ? "bg-amber-500/10 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400" :
                                                "bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400"
                                    )}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={cn(
                                            "p-3 rounded-2xl transition-transform group-hover:rotate-12 duration-300",
                                            insight.type === "positive" ? "bg-emerald-500/20" :
                                                insight.type === "warning" ? "bg-amber-500/20" :
                                                    "bg-indigo-500/20"
                                        )}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <Badge variant="outline" className={cn(
                                                "border-current/20 mb-2 uppercase text-[10px] font-black tracking-widest",
                                                insight.type === "positive" ? "text-emerald-600 dark:text-emerald-500" :
                                                    insight.type === "warning" ? "text-amber-600 dark:text-amber-500" :
                                                        "text-indigo-600 dark:text-indigo-500"
                                            )}>
                                                {insight.type}
                                            </Badge>
                                            <h4 className="font-black text-lg leading-tight group-hover:tracking-tight transition-all">
                                                {insight.title}
                                            </h4>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                        {insight.insight}
                                    </p>

                                    {/* Decorative subtle element */}
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <Icon className="h-24 w-24" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
