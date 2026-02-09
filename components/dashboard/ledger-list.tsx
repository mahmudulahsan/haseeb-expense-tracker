"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, Trash2, X, Plus, Pencil, ArrowRightLeft, ShieldCheck, Scale, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteTransactionButton } from "@/components/dashboard/delete-transaction-button";
import { parseLocalDate, formatDisplayTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { deleteTransactionsBulk } from "@/app/actions/finance";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

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
                toast.error(result.error);
            } else {
                toast.success(`${selectedIds.length} transactions deleted successfully`);
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
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {selectedIds.length < expenses.length && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIds(expenses.map(e => e.id))}
                                    className="h-8 px-2 sm:px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:text-primary transition-all hidden sm:flex"
                                >
                                    <Check className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Select All</span>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="h-8 px-2 sm:px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                            >
                                <X className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Clear All</span>
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowConfirm(true)}
                                disabled={isDeleting}
                                className="h-8 px-2 sm:px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 gap-1.5 sm:gap-2 border-none"
                            >
                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                className={cn("space-y-2 overflow-y-auto smooth-scroll pr-2 flex-1")}
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
                                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
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
                                                "h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-[1rem] shadow-sm flex items-center justify-center font-bold text-xs sm:text-sm shrink-0",
                                                expense.type === 'income' ? "bg-emerald-500/10 text-emerald-600" :
                                                    expense.type === 'transfer' ? "bg-blue-500/10 text-blue-600" :
                                                        "bg-red-500/10 text-red-600"
                                            )}
                                        >
                                            {expense.type === 'transfer' ? <ArrowRightLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : (expense.categories?.name?.charAt(0) || "U")}
                                        </motion.div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold truncate text-sm sm:text-base leading-tight">{expense.description}</p>
                                            <div className="flex items-center gap-1 sm:gap-2 mt-0.5 overflow-hidden">
                                                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-tight sm:tracking-widest truncate shrink-0 max-w-[80px] sm:max-w-none">
                                                    {accounts.find(a => a.id === expense.account_id)?.name || "External"}
                                                    {expense.type === 'transfer' && (
                                                        <>
                                                            <span className="mx-0.5 sm:mx-1">→</span>
                                                            {accounts.find(a => a.id === expense.to_account_id)?.name || "External"}
                                                        </>
                                                    )}
                                                </p>
                                                {expense.type !== 'transfer' && (
                                                    <>
                                                        <span className="text-[8px] opacity-30 shrink-0">•</span>
                                                        <p className="text-[9px] sm:text-[10px] text-primary/60 font-bold uppercase tracking-tight sm:tracking-widest truncate">
                                                            {expense.categories?.name || "Uncategorized"}
                                                        </p>
                                                    </>
                                                )}
                                                {expense.time && (
                                                    <>
                                                        <span className="text-[8px] opacity-30 shrink-0">•</span>
                                                        <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-tight sm:tracking-widest shrink-0">
                                                            {formatDisplayTime(expense.time)}
                                                        </p>
                                                    </>
                                                )}
                                                {expense.type === 'expense' && expense.necessity_level && (
                                                    <>
                                                        <span className="text-[8px] opacity-30 shrink-0">•</span>
                                                        <div className="flex items-center gap-1" title={expense.necessity_level}>
                                                            {expense.necessity_level === 'necessary' && <ShieldCheck className="h-3 w-3 text-emerald-500/70" />}
                                                            {expense.necessity_level === 'neutral' && <Scale className="h-3 w-3 text-zinc-400" />}
                                                            {expense.necessity_level === 'unnecessary' && <Gem className="h-3 w-3 text-rose-500/70" />}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                                        <motion.div
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                            className="flex flex-col items-end"
                                        >
                                            <p className={cn(
                                                "font-black text-sm sm:text-lg whitespace-nowrap",
                                                expense.type === 'income' ? "text-emerald-500" :
                                                    expense.type === 'transfer' ? "text-blue-500" :
                                                        "text-red-500"
                                            )}>
                                                {expense.type === 'income' ? '+' : expense.type === 'expense' ? '-' : ''}{currencySymbol}{expense.amount.toFixed(2)}
                                            </p>
                                            <Badge variant="outline" className="text-[8px] sm:text-[9px] uppercase tracking-tighter h-4 sm:h-5 px-1 sm:px-2 mt-0.5 sm:mt-0">
                                                {expense.type}
                                            </Badge>
                                        </motion.div>
                                        <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                                            {onAddAgain && (
                                                <motion.div
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="hidden sm:block"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onAddAgain(expense)}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-lg shadow-primary/10 border border-primary/20"
                                                        title="Add Again"
                                                    >
                                                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                            {onEdit && (
                                                <motion.div
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="hidden sm:block"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit(expense)}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/10 border border-blue-200 dark:border-blue-900/30"
                                                        title="Edit Transaction"
                                                    >
                                                        <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                            <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                                                <DeleteTransactionButton id={expense.id} />
                                            </div>
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
