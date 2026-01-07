"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, Loader2, Save, AlertTriangle, PieChart, CheckCircle2, ChevronRight, TrendingUp } from "lucide-react";
import { updateCategoryTarget, getMonthlyCategorySpending } from "@/app/actions/finance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "@/components/dashboard/searchable-select";

interface CategoryTargetsDialogProps {
    categories: any[];
    currencySymbol?: string;
    onUpdate?: () => void;
}

export function CategoryTargetsDialog({
    categories,
    currencySymbol = "$",
    onUpdate
}: CategoryTargetsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data
    const [spendingMap, setSpendingMap] = useState<Record<string, number>>({});
    const [targets, setTargets] = useState<Record<string, number>>({});

    // Selection
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [amount, setAmount] = useState("");

    // Initialize targets map
    useEffect(() => {
        const t: Record<string, number> = {};
        categories.forEach(c => {
            t[c.id] = c.monthly_target || 0;
        });
        setTargets(t);
    }, [categories, open]);

    // Fetch stats on open
    useEffect(() => {
        if (open) {
            fetchStats();
        }
    }, [open]);

    // Update input when category is selected
    useEffect(() => {
        if (selectedCategoryId) {
            const currentTarget = targets[selectedCategoryId] || 0;
            setAmount(currentTarget > 0 ? currentTarget.toString() : "");
        } else {
            setAmount("");
        }
    }, [selectedCategoryId, targets]);

    async function fetchStats() {
        setLoadingStats(true);
        const res = await getMonthlyCategorySpending();
        if (res.success && res.spending) {
            setSpendingMap(res.spending);
        }
        setLoadingStats(false);
    }

    async function handleSave() {
        if (!selectedCategoryId) return;
        setSaving(true);

        const numAmount = parseFloat(amount) || 0;
        const res = await updateCategoryTarget(selectedCategoryId, numAmount);

        if (res.success) {
            toast.success("Target updated");
            // Update local state
            setTargets(prev => ({ ...prev, [selectedCategoryId]: numAmount }));
            if (onUpdate) onUpdate();
        } else {
            toast.error(res.error || "Failed to update target");
        }
        setSaving(false);
    }

    const expenseCategories = categories.filter(c => c.type === 'expense');

    // Calculate visualization data
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const spent = selectedCategoryId ? (spendingMap[selectedCategoryId] || 0) : 0;
    const target = parseFloat(amount) || targets[selectedCategoryId] || 0;
    const remaining = Math.max(0, target - spent);
    const isOver = target > 0 && spent > target;
    const percentage = target > 0 ? (spent / target) * 100 : 0;

    // Filter categories that have active targets
    const activeTargets = expenseCategories.filter(c => (targets[c.id] || 0) > 0);
    // Sort by percentage spent (highest first)
    activeTargets.sort((a, b) => {
        const spentA = spendingMap[a.id] || 0;
        const targetA = targets[a.id] || 1;
        const pctA = spentA / targetA;

        const spentB = spendingMap[b.id] || 0;
        const targetB = targets[b.id] || 1;
        const pctB = spentB / targetB;

        return pctB - pctA;
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold sm:font-medium text-gray-500 hover:text-black dark:hover:text-white transition-all cursor-pointer relative z-30">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Targets</span>
                </button>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-4xl rounded-[2rem] flex flex-col md:flex-row p-0 gap-0 overflow-hidden bg-gray-50 dark:bg-neutral-950 border-white/20 dark:border-white/10 shadow-2xl max-h-[85vh]">

                {/* Left Side (or Top on mobile): Input Form */}
                <div className="w-full md:w-1/3 bg-white dark:bg-black/40 p-6 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 z-10 shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Set Target
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            Choose a category and set your monthly limit.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                            <SearchableSelect
                                options={expenseCategories}
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                                placeholder="Select category..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Limit Amount</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full h-12 pl-8 pr-4 bg-gray-100 dark:bg-white/5 disabled:opacity-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary font-bold text-lg transition-all"
                                    placeholder="0.00"
                                    disabled={!selectedCategoryId}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={!selectedCategoryId || saving}
                            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Goal
                        </Button>
                    </div>

                    {/* Donut Chart Visualization (Only visible when category selected) */}
                    <AnimatePresence mode="wait">
                        {selectedCategoryId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mt-auto pt-6 flex flex-col items-center"
                            >
                                <div className="relative h-32 w-32 mb-4">
                                    <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-white/5" />
                                        {target > 0 && (
                                            <motion.circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke={isOver ? "#ef4444" : "currentColor"}
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                className={cn("text-primary transition-colors duration-500", isOver && "text-red-500")}
                                                strokeDasharray={283}
                                                strokeDashoffset={283 - (Math.min(percentage, 100) / 100) * 283}
                                                initial={{ strokeDashoffset: 283 }}
                                                animate={{ strokeDashoffset: 283 - (Math.min(percentage, 100) / 100) * 283 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                        )}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={cn("text-xs font-black uppercase tracking-tighter opacity-50", isOver && "text-red-500")}>
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full flex justify-between text-xs font-medium px-2">
                                    <span className={cn(isOver ? "text-red-500 font-bold" : "text-muted-foreground")}>
                                        {currencySymbol}{spent.toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground">
                                        / {currencySymbol}{target.toLocaleString()}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side (or Bottom): Active Goals List */}
                <div className="flex-1 flex flex-col min-h-[300px] md:min-h-[400px] bg-white/50 dark:bg-black/20">
                    <div className="p-6 pb-2 shrink-0 flex items-center justify-between">
                        <h3 className="font-black text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            Active Goals
                            <span className="bg-gray-100 dark:bg-white/10 text-xs px-2 py-0.5 rounded-full text-foreground/70">
                                {activeTargets.length}
                            </span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 custom-scrollbar">
                        {loadingStats && activeTargets.length === 0 ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : activeTargets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                                <div className="bg-gray-200 dark:bg-white/5 p-4 rounded-full mb-4">
                                    <Target className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="font-bold text-sm">No goals set yet</p>
                                <p className="text-xs max-w-[200px] mt-1">Select a category on the left to start tracking your budget.</p>
                            </div>
                        ) : (
                            activeTargets.map((item) => {
                                const itemSpent = spendingMap[item.id] || 0;
                                const itemTarget = targets[item.id] || 0;
                                const itemPct = (itemSpent / itemTarget) * 100;
                                const itemIsOver = itemPct > 100;
                                const isSelected = selectedCategoryId === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedCategoryId(item.id);
                                            setAmount(itemTarget.toString());
                                        }}
                                        className={cn(
                                            "w-full text-left group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                                            isSelected
                                                ? "bg-white dark:bg-white/5 border-primary ring-1 ring-primary shadow-lg"
                                                : "bg-white dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:shadow-md"
                                        )}
                                    >
                                        <div
                                            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0 transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: item.color + '20', color: item.color }}
                                        >
                                            {/* Using emoji or first char if no icon system */}
                                            {item.name[0]}
                                        </div>

                                        <div className="flex-1 min-w-0 z-10">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                                <div className="text-xs font-medium tabular-nums">
                                                    <span className={cn(itemIsOver ? "text-red-500 font-bold" : "text-gray-500")}>
                                                        {currencySymbol}{itemSpent.toLocaleString()}
                                                    </span>
                                                    <span className="text-gray-300 mx-1">/</span>
                                                    <span className="text-gray-400">{currencySymbol}{itemTarget.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(itemPct, 100)}%` }}
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        itemIsOver ? "bg-red-500" : "bg-primary"
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}
                                    </button>
                                );
                            })
                        )}

                        <div className="h-4" /> {/* Spacer */}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
