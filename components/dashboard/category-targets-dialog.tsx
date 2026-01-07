"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, Loader2, Save, X } from "lucide-react";
import { updateCategoryTarget, getMonthlyCategorySpending } from "@/app/actions/finance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "@/components/dashboard/searchable-select";

interface CategoryTargetsDialogProps {
    categories: any[];
    currencySymbol?: string;
    onUpdate?: () => void;
    trigger?: React.ReactNode;
    initialCategoryId?: string;
}

export function CategoryTargetsDialog({
    categories,
    currencySymbol = "$",
    onUpdate,
    trigger,
    initialCategoryId
}: CategoryTargetsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data
    const [spendingMap, setSpendingMap] = useState<Record<string, number>>({});
    const [targets, setTargets] = useState<Record<string, number>>({});

    // Selection
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId || "");
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
            setOpen(false);
        } else {
            toast.error(res.error || "Failed to update target");
        }
        setSaving(false);
    }

    const expenseCategories = categories.filter(c => c.type === 'expense');

    const spent = selectedCategoryId ? (spendingMap[selectedCategoryId] || 0) : 0;
    const target = parseFloat(amount) || targets[selectedCategoryId] || 0;
    const isOver = target > 0 && spent > target;
    const percentage = target > 0 ? (spent / target) * 100 : 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold sm:font-medium text-gray-500 hover:text-black dark:hover:text-white transition-all cursor-pointer relative z-30">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Targets</span>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-md rounded-[2rem] p-0 bg-white dark:bg-[#0A0A0A] border-white/20 dark:border-white/10 shadow-2xl">
                <div className="p-8 flex flex-col gap-8 relative">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Target className="h-5 w-5" />
                            </div>
                            Set Target
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-2 opacity-60">
                            Set a monthly spending limit for this category.
                        </p>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Category</label>
                            <SearchableSelect
                                options={expenseCategories}
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                                placeholder="Select category..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Limit Amount</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xl group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full h-16 pl-10 pr-6 bg-gray-50 dark:bg-white/5 disabled:opacity-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary font-black text-2xl transition-all tracking-tighter"
                                    placeholder="0.00"
                                    disabled={!selectedCategoryId}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={!selectedCategoryId || saving}
                            className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            Update Target
                        </Button>
                    </div>

                    {/* Progress Visualization (Simplified) */}
                    <AnimatePresence mode="wait">
                        {selectedCategoryId && target > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="relative z-10 space-y-4 pt-4 border-t border-dashed border-gray-200 dark:border-white/10"
                            >
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Current Status</p>
                                        <p className={cn("text-lg font-black tracking-tighter", isOver ? "text-red-500" : "text-emerald-500")}>
                                            {percentage.toFixed(0)}% Utilized
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Spent so far</p>
                                        <p className="text-sm font-bold">{currencySymbol}{spent.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200/20">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            isOver ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-primary shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        )}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
