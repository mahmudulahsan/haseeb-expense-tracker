"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Calendar, User, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseLocalDate, formatDisplayTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";

interface AdminTransactionListProps {
    transactions: any[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

export function AdminTransactionList({ transactions, currentPage, totalPages, totalCount }: AdminTransactionListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`?${params.toString()}`);
    };

    let lastDate = "";

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Global Transaction Stream
                    </CardTitle>
                    <CardDescription>
                        Real-time feed across all users ({totalCount} total)
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                    {transactions.length === 0 ? (
                        <div className="text-center py-20 opacity-30 italic text-zinc-500">No transactions found.</div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((expense: any) => {
                                const showDivider = expense.date !== lastDate;
                                lastDate = expense.date;

                                return (
                                    <div key={expense.id} className="space-y-2">
                                        {showDivider && (
                                            <div className="flex items-center gap-4 py-3 first:pt-0">
                                                <div className="h-[1px] flex-1 bg-zinc-800" />
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm">
                                                    <Calendar className="h-3 w-3 text-zinc-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                                                        {parseLocalDate(expense.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="h-[1px] flex-1 bg-zinc-800" />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                                                    expense.type === 'income' ? "bg-emerald-500/10 text-emerald-500" :
                                                        expense.type === 'transfer' ? "bg-blue-500/10 text-blue-500" :
                                                            "bg-red-500/10 text-red-500"
                                                )}>
                                                    {expense.type === 'transfer' ? <ArrowRightLeft className="h-4 w-4" /> : (expense.categories?.name?.charAt(0) || "U")}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-zinc-200 truncate text-sm">
                                                            {expense.description || "No description"}
                                                        </p>
                                                        {expense.user && (
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-zinc-700 text-zinc-400">
                                                                <User className="h-2 w-2 mr-1" />
                                                                {expense.user.name || expense.user.email?.split('@')[0]}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">
                                                            {expense.accounts?.name || "Unknown Account"}
                                                        </p>
                                                        <span className="text-[8px] text-zinc-700">•</span>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">
                                                            {expense.categories?.name || "Uncategorized"}
                                                        </p>
                                                        {expense.time && (
                                                            <>
                                                                <span className="text-[8px] text-zinc-700">•</span>
                                                                <p className="text-[10px] text-zinc-600 font-mono">
                                                                    {formatDisplayTime(expense.time)}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right ml-3">
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-zinc-800 text-zinc-400 border-none mt-1">
                                                    {expense.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800"
                    >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Previous
                    </Button>
                    <span className="text-xs text-zinc-500 font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800"
                    >
                        Next
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
