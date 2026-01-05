"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, Trash2, X, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteTransactionButton } from "@/components/dashboard/delete-transaction-button";
import { parseLocalDate, formatDisplayTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { deleteTransactionsBulk } from "@/app/actions/finance";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface LedgerListProps {
    expenses: any[];
    accounts: any[];
    currencySymbol: string;
    maxHeight?: string;
    onAddAgain?: (expense: any) => void;
    onEdit?: (expense: any) => void;
}

export function LedgerList({ expenses, accounts, currencySymbol, maxHeight = "450px", onAddAgain, onEdit }: LedgerListProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (expenses.length === 0) {
        return <div className="text-center py-20 opacity-30 italic">No transactions for this period.</div>;
    }

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteTransactionsBulk(selectedIds);
            if (result.error) {
                alert(result.error);
            } else {
                setSelectedIds([]);
            }
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    let lastDate = "";

    return (
        <div className="relative h-full flex flex-col min-h-0">
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="sticky top-0 z-20 mb-4 p-2.5 bg-white/80 dark:bg-zinc-900/80 border border-primary/20 rounded-2xl shadow-xl flex items-center justify-between gap-4 backdrop-blur-xl shrink-0"
                    >
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedIds([])}
                                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                {selectedIds.length} Selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const allIds = expenses.map(e => e.id);
                                    setSelectedIds(allIds.length === selectedIds.length ? [] : allIds);
                                }}
                                className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                            >
                                {selectedIds.length === expenses.length ? "Deselect All" : "Select All"}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowConfirm(true)}
                                disabled={isDeleting}
                                className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 gap-2 border-none"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.05
                        }
                    }
                }}
                className={cn("space-y-2 overflow-y-auto custom-scrollbar smooth-scroll pr-2 flex-1")}
                style={{ maxHeight }}
            >
                <AnimatePresence mode="popLayout">
                    {expenses.map((expense: any) => {
                        const isSelected = selectedIds.includes(expense.id);
                        const showDivider = expense.date !== lastDate;
                        lastDate = expense.date;
                        return (
                            <motion.div
                                key={expense.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-2"
                            >
                                {showDivider && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-4 py-3 first:pt-0"
                                    >
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                                            <Calendar className="h-3 w-3 text-primary/60" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">
                                                {parseLocalDate(expense.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                                    </motion.div>
                                )}
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    onClick={(e) => toggleSelect(expense.id, e)}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-2xl transition-all border border-transparent cursor-pointer group/item",
                                        isSelected
                                            ? "bg-primary/10 border-primary/30 dark:bg-primary/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 hover:border-dashed hover:border-gray-200 dark:hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div
                                            className={cn(
                                                "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                                isSelected
                                                    ? "bg-primary border-primary"
                                                    : "border-gray-200 dark:border-white/10 opacity-0 group-hover/item:opacity-100"
                                            )}
                                        >
                                            <Check className={cn("h-3 w-3 text-white transition-transform", isSelected ? "scale-100" : "scale-0")} />
                                        </div>

                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className={cn(
                                                "h-10 w-10 rounded-[1rem] shadow-sm flex items-center justify-center font-bold text-sm shrink-0",
                                                expense.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                                            )}
                                        >
                                            {expense.categories?.name?.charAt(0) || "U"}
                                        </motion.div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold truncate">{expense.description}</p>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate shrink-0">
                                                    {accounts.find(a => a.id === expense.account_id)?.name || "External"}
                                                </p>
                                                <span className="text-[8px] opacity-30 shrink-0">•</span>
                                                <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest truncate">
                                                    {expense.categories?.name || "Uncategorized"}
                                                </p>
                                                {expense.time && (
                                                    <>
                                                        <span className="text-[8px] opacity-30 shrink-0">•</span>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest shrink-0">
                                                            {formatDisplayTime(expense.time)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <motion.div
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                        >
                                            <p className={cn(
                                                "font-black text-base sm:text-lg",
                                                expense.type === 'income' ? "text-emerald-500" : "text-orange-500"
                                            )}>
                                                {expense.type === 'income' ? '+' : '-'}{currencySymbol}{expense.amount.toFixed(2)}
                                            </p>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-5 px-2">
                                                {expense.type}
                                            </Badge>
                                        </motion.div>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {onAddAgain && (
                                                <motion.div
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onAddAgain(expense)}
                                                        className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-lg shadow-primary/10 border border-primary/20"
                                                        title="Add Again"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                            {onEdit && (
                                                <motion.div
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit(expense)}
                                                        className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/10 border border-blue-200 dark:border-blue-900/30"
                                                        title="Edit Transaction"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                            <DeleteTransactionButton id={expense.id} />
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={handleBulkDelete}
                title="Delete Multiple Transactions"
                description={`Are you sure you want to delete ${selectedIds.length} transactions? This action cannot be undone and account balances will be adjusted.`}
            />
        </div>
    );
}
