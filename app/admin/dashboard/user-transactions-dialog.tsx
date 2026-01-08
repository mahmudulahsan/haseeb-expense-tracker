"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Calendar, Clock, ArrowRightLeft, TrendingUp, TrendingDown, Trash2, CheckSquare, Square } from "lucide-react";
import { getUserTransactions, deleteUserTransaction, deleteUserTransactionsBulk } from "./actions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface UserTransactionsDialogProps {
    userId: string;
    userEmail: string;
    transactionCount: number;
}

export function UserTransactionsDialog({ userId, userEmail, transactionCount }: UserTransactionsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Deletion states
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    async function fetchTransactions() {
        setLoading(true);
        try {
            const res = await getUserTransactions(userId);
            if (res.success) {
                setTransactions(res.transactions || []);
                setLoaded(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    }

    async function handleOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (isOpen && !loaded) {
            await fetchTransactions();
        }
    }

    async function handleDeleteConfirmed() {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteUserTransaction(deleteId, userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Transaction deleted successfully");
                setTransactions(prev => prev.filter(tx => tx.id !== deleteId));
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    }

    async function handleBulkDeleteConfirmed() {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        try {
            const res = await deleteUserTransactionsBulk(selectedIds, userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`${selectedIds.length} transactions deleted successfully`);
                setTransactions(prev => prev.filter(tx => !selectedIds.includes(tx.id)));
                setSelectedIds([]);
            }
        } catch (error) {
            toast.error("An error occurred while deleting transactions");
        } finally {
            setIsDeleting(false);
            setIsBulkDeleting(false);
        }
    }

    function toggleSelect(id: string) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    function toggleSelectAll() {
        if (selectedIds.length === transactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(transactions.map(tx => tx.id));
        }
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case "income":
                return <TrendingUp className="h-4 w-4 text-emerald-500" />;
            case "expense":
                return <TrendingDown className="h-4 w-4 text-rose-500" />;
            case "transfer":
                return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
            default:
                return <FileText className="h-4 w-4 text-zinc-500" />;
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                        <span className="sr-only">View transactions</span>
                        <FileText className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-8">
                            <span>Transaction History</span>
                            {selectedIds.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setIsBulkDeleting(true)}
                                    className="h-7 text-xs"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete ({selectedIds.length})
                                </Button>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Viewing records for {userEmail}. Admin can manage or delete these entries.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Selection Header */}
                    {transactions.length > 0 && (
                        <div className="flex items-center gap-2 px-1 py-2 border-b border-zinc-800 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
                                onClick={toggleSelectAll}
                            >
                                {selectedIds.length === transactions.length ? <CheckSquare className="mr-2 h-3 w-3 text-emerald-500" /> : <Square className="mr-2 h-3 w-3" />}
                                {selectedIds.length === transactions.length ? "Deselect All" : "Select All"}
                            </Button>
                            <span className="text-xs text-zinc-500 ml-auto">{transactions.length} total entries</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto pr-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                <p className="text-zinc-500 text-sm">Loading records...</p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="py-12 text-center text-zinc-500">
                                No transactions recorded.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className={`group flex items-center justify-between p-3 rounded-lg border bg-zinc-950/50 transition-colors ${selectedIds.includes(tx.id) ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-zinc-800 hover:bg-zinc-800/50'}`}
                                        onClick={() => toggleSelect(tx.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Checkbox
                                                checked={selectedIds.includes(tx.id)}
                                                onCheckedChange={() => toggleSelect(tx.id)}
                                                className={`border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600`}
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                    {getTypeIcon(tx.type)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium capitalize text-zinc-200">{tx.type}</span>
                                                    </div>
                                                    <span className="text-xs text-zinc-500 font-mono">{tx.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center text-xs text-zinc-300">
                                                    <Calendar className="mr-1 h-3 w-3 text-zinc-500" />
                                                    {tx.date || "N/A"}
                                                </div>
                                                <div className="flex items-center text-xs text-zinc-500 mt-0.5">
                                                    <Clock className="mr-1 h-3 w-3 text-zinc-600" />
                                                    {tx.time || "N/A"}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(tx.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog >

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(val) => !val && setDeleteId(null)}
                onConfirm={handleDeleteConfirmed}
                title="Delete Transaction"
                description="Are you sure you want to delete this transaction? This will revert the balance impact on the user's account."
                variant="destructive"
            />

            <ConfirmDialog
                open={isBulkDeleting}
                onOpenChange={(val) => !val && setIsBulkDeleting(false)}
                onConfirm={handleBulkDeleteConfirmed}
                title={`Delete ${selectedIds.length} Transactions`}
                description={`Are you sure you want to delete these ${selectedIds.length} transactions? This will revert their balance impacts on the user's accounts. This action cannot be undone.`}
                variant="destructive"
            />
        </>
    );
}
