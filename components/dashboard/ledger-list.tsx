"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteTransactionButton } from "@/components/dashboard/delete-transaction-button";

interface LedgerListProps {
    expenses: any[];
    accounts: any[];
    currencySymbol: string;
    maxHeight?: string;
}

export function LedgerList({ expenses, accounts, currencySymbol, maxHeight = "450px" }: LedgerListProps) {
    if (expenses.length === 0) {
        return <div className="text-center py-20 opacity-30 italic">No transactions for this period.</div>;
    }

    let lastDate = "";

    return (
        <div className={cn("space-y-2 overflow-y-auto no-scrollbar pr-2")} style={{ maxHeight }}>
            {expenses.map((expense: any) => {
                const showDivider = expense.date !== lastDate;
                lastDate = expense.date;
                return (
                    <div key={expense.id} className="space-y-2">
                        {showDivider && (
                            <div className="flex items-center gap-4 py-4 first:pt-0">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                                    <Calendar className="h-3 w-3 text-primary/60" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">
                                        {new Date(expense.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                            </div>
                        )}
                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-dashed hover:border-gray-200 dark:hover:border-white/20 group/item">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-[1rem] shadow-sm flex items-center justify-center font-bold",
                                    expense.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                                )}>
                                    {expense.categories?.name?.charAt(0) || "U"}
                                </div>
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
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div>
                                    <p className={cn(
                                        "font-black text-lg",
                                        expense.type === 'income' ? "text-emerald-500" : "text-orange-500"
                                    )}>
                                        {expense.type === 'income' ? '+' : '-'}{currencySymbol}{expense.amount.toFixed(2)}
                                    </p>
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-5 px-2">
                                        {expense.type}
                                    </Badge>
                                </div>
                                <DeleteTransactionButton id={expense.id} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
