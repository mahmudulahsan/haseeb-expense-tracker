"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Unplug, Info, Trash2, Plus, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getLiabilitiesData, updateLiabilitiesData } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

interface LiabilityEntry {
    id: string;
    source: string;
    amount: string;
}

export function LiabilitiesContent({
    currencySymbol,
}: {
    currencySymbol: string;
}) {
    const [liabilities, setLiabilities] = useState<LiabilityEntry[]>([]);
    const [calculate, setCalculate] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            const result = await getLiabilitiesData();
            if (result.success) {
                setLiabilities(result.liabilities || []);
                setCalculate(result.calculate || false);
            }
            setTimeout(() => setIsLoaded(true), 200);
        }
        loadData();
    }, []);

    const debouncedSave = useDebouncedCallback(async (list: LiabilityEntry[], calc: boolean) => {
        setIsSaving(true);
        await updateLiabilitiesData(list, calc);
        setIsSaving(false);
    }, 1000);

    useEffect(() => {
        if (isLoaded) {
            debouncedSave(liabilities, calculate);
        }
    }, [liabilities, calculate, isLoaded, debouncedSave]);

    const addLiability = () => {
        const newLiability: LiabilityEntry = {
            id: crypto.randomUUID(),
            source: "",
            amount: "",
        };
        setLiabilities([...liabilities, newLiability]);
    };

    const removeLiability = (id: string) => {
        setLiabilities(liabilities.filter(l => l.id !== id));
    };

    const updateLiability = (id: string, field: keyof LiabilityEntry, value: string) => {
        setLiabilities(liabilities.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const totalLiabilities = useMemo(() => {
        return liabilities.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    }, [liabilities]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Info */}
            <div className="relative overflow-hidden rounded-[2rem] bg-amber-500/10 p-8 border border-amber-500/20">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Unplug className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Your Liabilities</h1>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground max-w-xl">
                            Track your borrowed amounts and manage your debts dynamically.
                        </p>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: List of Liabilities */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                Liabilities List
                                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    {currencySymbol}{totalLiabilities.toLocaleString()}
                                </span>
                            </CardTitle>
                            <Button
                                onClick={addLiability}
                                size="sm"
                                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add New
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {liabilities.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-12 text-center text-muted-foreground italic text-sm"
                                    >
                                        No liabilities recorded yet.
                                    </motion.div>
                                ) : (
                                    liabilities.map((liability) => (
                                        <motion.div
                                            key={liability.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 dark:bg-white/5 p-4 rounded-2xl relative group"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                                    Source
                                                </label>
                                                <input
                                                    type="text"
                                                    value={liability.source}
                                                    onChange={(e) => updateLiability(liability.id, 'source', e.target.value)}
                                                    className="w-full h-10 bg-white dark:bg-black/20 border-none rounded-xl px-4 text-sm font-bold/80 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                                    placeholder="e.g. Bank, Friend, etc."
                                                />
                                            </div>
                                            <div className="space-y-2 relative pr-10">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                                    Amount
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black opacity-30">
                                                        {currencySymbol}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={liability.amount}
                                                        onChange={(e) => updateLiability(liability.id, 'amount', e.target.value)}
                                                        className="w-full h-10 bg-white dark:bg-black/20 border-none rounded-xl pl-8 pr-4 text-sm font-black focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeLiability(liability.id)}
                                                    className="absolute right-0 bottom-1 p-2 text-red-500/40 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <Card className="border-none shadow-2xl bg-amber-600 dark:bg-amber-900/40 text-white overflow-hidden relative group sticky top-8">
                        <CardHeader>
                            <CardTitle className="text-xl font-black uppercase tracking-widest opacity-60">Liabilities Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center opacity-80">
                                    <span className="text-xs font-bold uppercase tracking-widest">Total Liability</span>
                                    <span className="text-2xl font-black">{currencySymbol}{totalLiabilities.toLocaleString()}</span>
                                </div>
                                <div className="h-[1px] bg-white/10 w-full" />
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                    <Info className="h-5 w-5 text-white/60 shrink-0" />
                                    <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-wider">
                                        These liabilities can be deducted from your total balance on the home screen.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4 border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Calculate on Home</span>
                                    <span className="text-[9px] opacity-60">Deduct from net balance</span>
                                </div>
                                <button
                                    onClick={() => setCalculate(!calculate)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative flex items-center px-1",
                                        calculate ? "bg-amber-400" : "bg-white/20"
                                    )}
                                >
                                    <motion.div
                                        animate={{ x: calculate ? 24 : 0 }}
                                        className="h-4 w-4 bg-white rounded-full shadow-lg"
                                    />
                                </button>
                            </div>

                            <Button
                                disabled={isSaving}
                                className={cn(
                                    "w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    "bg-white/10 hover:bg-white/20 text-white"
                                )}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                {isSaving ? "Saving..." : "All Changes Saved"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
