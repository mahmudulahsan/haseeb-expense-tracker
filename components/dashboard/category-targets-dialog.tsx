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
import { Target, Loader2, Save, AlertTriangle, PieChart } from "lucide-react";
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

    // Pie Chart Components
    // We'll create a simple donut/pie chart using conic-gradient
    const pieGradient = isOver
        ? `conic-gradient(#ef4444 0% 100%)` // All red if over
        : `conic-gradient(var(--primary) 0% ${percentage}%, #e5e7eb ${percentage}% 100%)`; // Primary vs Gray

    // For dark mode adjustment, we can use a class or style approach, but conic-gradient uses colors directly.
    // Let's use CSS variables if possible or static colors for simplicity, respecting the theme classes effectively.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold sm:font-medium text-gray-500 hover:text-black dark:hover:text-white transition-all cursor-pointer relative z-30">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Targets</span>
                </button>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-md rounded-[2rem] flex flex-col p-6 gap-6 bg-white dark:bg-neutral-950 border-white/20 dark:border-white/10 shadow-2xl">

                <div className="flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Set Target
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            Set limits per category to track spending.
                        </p>
                    </div>
                    {loadingStats && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                <div className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                        <SearchableSelect
                            options={expenseCategories}
                            value={selectedCategoryId}
                            onValueChange={setSelectedCategoryId}
                            placeholder="Select category..."
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{currencySymbol}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-12 pl-8 pr-4 bg-gray-100 dark:bg-white/5 disabled:opacity-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary font-bold text-lg"
                                placeholder="0.00"
                                disabled={!selectedCategoryId}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={!selectedCategoryId || saving}
                        className="w-full h-12 rounded-2xl text-base font-bold"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Target
                    </Button>
                </div>

                {/* Visualization / Pie Chart */}
                <AnimatePresence mode="wait">
                    {selectedCategoryId && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-gray-50 dark:bg-white/5 rounded-[1.5rem] p-6 flex flex-col items-center gap-4 border border-gray-100 dark:border-white/5 relative overflow-hidden"
                        >
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground self-start w-full border-b border-dashed border-gray-200 dark:border-white/10 pb-2 mb-2 flex justify-between items-center">
                                <span>Spending Analysis</span>
                                {isOver && <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Over Budget</span>}
                            </h4>

                            <div className="relative h-40 w-40">
                                {/* Pie Chart Visualization using SVG for smoother animation */}
                                <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                                    {/* Background Circle */}
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-white/10" />

                                    {/* Progress Circle */}
                                    {target > 0 && (
                                        <motion.circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke={isOver ? "#ef4444" : "currentColor"}
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            className={cn("text-primary", isOver && "text-red-500")}
                                            strokeDasharray={283} // 2 * PI * 45
                                            strokeDashoffset={283 - (Math.min(percentage, 100) / 100) * 283}
                                            initial={{ strokeDashoffset: 283 }}
                                            animate={{ strokeDashoffset: 283 - (Math.min(percentage, 100) / 100) * 283 }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    )}
                                </svg>

                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                        {isOver ? "Over" : "Left"}
                                    </span>
                                    <span className={cn(
                                        "text-xl font-black tracking-tighter",
                                        isOver ? "text-red-500" : "text-foreground"
                                    )}>
                                        {currencySymbol}{isOver ? (spent - target).toFixed(0) : remaining.toFixed(0)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full text-center">
                                <div className="bg-white dark:bg-black/20 rounded-xl p-2 border border-gray-100 dark:border-white/5">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Budget</div>
                                    <div className="font-bold text-sm">{currencySymbol}{target.toLocaleString()}</div>
                                </div>
                                <div className="bg-white dark:bg-black/20 rounded-xl p-2 border border-gray-100 dark:border-white/5">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Spent</div>
                                    <div className={cn("font-bold text-sm", isOver ? "text-red-500" : "text-primary")}>
                                        {currencySymbol}{spent.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!selectedCategoryId && (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-xs font-medium max-w-[200px]">
                            Select a category to view spending breakdown and set targets.
                        </p>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
