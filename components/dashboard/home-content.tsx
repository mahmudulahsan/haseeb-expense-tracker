"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { StatCard } from "@/components/dashboard/stat-card";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { MainBalance } from "@/components/dashboard/main-balance";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { DeleteAccountButton } from "@/components/dashboard/delete-account-button";
import { DeleteTransactionButton } from "@/components/dashboard/delete-transaction-button";
import { AddAccountDialog } from "@/components/dashboard/add-account-dialog";
import { SpendingHeatmap } from "@/components/dashboard/spending-heatmap";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Maximize2,
    Download,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { LedgerList } from "@/components/dashboard/ledger-list";
import { parseLocalDate, getTimeBasedGreeting } from "@/lib/date-utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface HomeContentProps {
    expenses: any[];
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol: string;
    totalIncome: number;
    totalSpent: number;
    zakatTarget: number;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function HomeContent({
    expenses,
    accounts,
    categories,
    greeting,
    currencySymbol,
    totalIncome,
    totalSpent,
    zakatTarget
}: HomeContentProps) {
    const timeGreeting = getTimeBasedGreeting();
    const personalizedGreeting = greeting.startsWith("Hey,")
        ? `${timeGreeting}, ${greeting.slice(5)}`
        : `${timeGreeting}! ${greeting}`;

    const now = new Date();
    const searchParams = useSearchParams();
    const query = searchParams.get("q")?.toLowerCase() || "";

    // Default to current month/year on load
    const [filterMonth, setFilterMonth] = useState<string>((now.getMonth() + 1).toString().padStart(2, '0'));

    const [filterYear, setFilterYear] = useState<string>(now.getFullYear().toString());

    const [filterCategory, setFilterCategory] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('filterCategory');
            return saved || "all";
        }
        return "all";
    });

    const [filterType, setFilterType] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('filterType');
            return saved || "all";
        }
        return "all";
    });

    // Save filter options to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('filterCategory', filterCategory);
    }, [filterCategory]);

    useEffect(() => {
        localStorage.setItem('filterType', filterType);
    }, [filterType]);

    const [detailedAccount, setDetailedAccount] = useState<any>(null);
    const [accountFilterMonth, setAccountFilterMonth] = useState<string>((now.getMonth() + 1).toString().padStart(2, '0'));
    const [accountFilterYear, setAccountFilterYear] = useState<string>(now.getFullYear().toString());

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addDialogInitialData, setAddDialogInitialData] = useState<any>(null);

    const handleOpenChange = (open: boolean) => {
        setIsAddDialogOpen(open);
        if (!open) {
            setAddDialogInitialData(null);
        }
    };

    const handleAddAgain = (expense: any) => {
        setAddDialogInitialData({
            amount: expense.amount,
            description: expense.description,
            category_id: expense.category_id,
            account_id: expense.account_id,
            type: expense.type
        });
        setIsAddDialogOpen(true);
    };

    // Generate years from data or defaults
    const years = useMemo(() => {
        const expenseYears = expenses.map(e => parseLocalDate(e.date).getFullYear());
        const currentYear = new Date().getFullYear();
        const uniqueYears = Array.from(new Set([...expenseYears, currentYear])).sort((a, b) => b - a);
        return uniqueYears.map(String);
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = parseLocalDate(expense.date);
            const m = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
            const y = expenseDate.getFullYear().toString();
            const matchesDate = m === filterMonth && y === filterYear;
            const matchesCategory = filterCategory === "all" || expense.category_id === filterCategory;
            const matchesType = filterType === "all" || expense.type === filterType;

            // Search filter
            const matchesSearch = !query ||
                expense.description?.toLowerCase().includes(query) ||
                expense.categories?.name?.toLowerCase().includes(query) ||
                accounts.find(a => a.id === expense.account_id)?.name?.toLowerCase().includes(query);

            return matchesDate && matchesCategory && matchesType && matchesSearch;
        });
    }, [expenses, filterMonth, filterYear, filterCategory, filterType, query, accounts]);

    const handleDownloadPDF = () => {
        if (filteredExpenses.length === 0) return;

        const doc = new jsPDF();
        const monthName = MONTHS[parseInt(filterMonth) - 1];
        const title = `${monthName} ${filterYear} - Transaction Ledger`;
        const currencyShort = currencySymbol === '৳' ? 'TK' : currencySymbol;

        // Add Header (Compact)
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text(title, 14, 15);

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 20);

        // Prepare Data
        const tableData = filteredExpenses.map(exp => {
            const acc = accounts.find(a => a.id === exp.account_id)?.name || "N/A";
            const cat = categories.find(c => c.id === exp.category_id)?.name || "N/A";
            const amount = `${exp.type === 'income' ? '+' : '-'}${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            return [
                exp.date,
                exp.description || "-",
                cat,
                acc,
                exp.type?.toUpperCase() || "EXPENSE",
                amount
            ];
        });

        // Add Table
        autoTable(doc, {
            startY: 28,
            head: [["Date", "Description", "Category", "Account", "Type", `Amount (${currencyShort})`]],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [249, 115, 22], // primary/orange color
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [60, 60, 60]
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            columnStyles: {
                5: { halign: 'right', fontStyle: 'bold' } // Amount column
            }
        });

        // Summary (Compact)
        const finalY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const netTotalValue = `${totalNet >= 0 ? '+' : ''}${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        doc.text(netTotalValue, doc.internal.pageSize.getWidth() - 14, finalY, { align: "right" });

        doc.save(`Ledger_${monthName}_${filterYear}.pdf`);
    };

    const totalNet = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => {
            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    }, [filteredExpenses]);

    const accountDetailedExpenses = useMemo(() => {
        if (!detailedAccount) return [];
        return expenses.filter(expense => {
            const matchesAccount = expense.account_id === detailedAccount.id;
            const expenseDate = parseLocalDate(expense.date);
            const m = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
            const y = expenseDate.getFullYear().toString();
            const matchesDate = m === accountFilterMonth && y === accountFilterYear;
            return matchesAccount && matchesDate;
        });
    }, [expenses, detailedAccount, accountFilterMonth, accountFilterYear]);

    const accountTotalNet = useMemo(() => {
        return accountDetailedExpenses.reduce((acc, curr) => {
            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    }, [accountDetailedExpenses]);



    return (
        <div className="space-y-8">


            {/* Top Grid: Balance and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Card (Primary Account) */}
                <div className="lg:col-span-8 h-full">
                    <Card className="bg-[#FFD966] dark:bg-primary/10 border-none shadow-xl overflow-hidden h-full relative group">
                        <CardContent className="p-6 sm:p-10">
                            <MainBalance
                                accounts={accounts}
                                categories={categories}
                                greeting={personalizedGreeting}
                                currencySymbol={currencySymbol}
                                expenses={expenses}
                                zakatTarget={zakatTarget}
                            >
                                <AddTransactionDialog
                                    accounts={accounts}
                                    categories={categories}
                                    currencySymbol={currencySymbol}
                                    open={isAddDialogOpen}
                                    onOpenChange={handleOpenChange}
                                    initialData={addDialogInitialData}
                                />
                            </MainBalance>
                        </CardContent>
                    </Card>
                </div>

                {/* Vertical Secondary Stats */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div>
                        <StatCard
                            title="Monthly Income"
                            value={`${currencySymbol}${totalIncome.toLocaleString()}`}
                            change="+12.5%"
                            icon={ArrowUpRight}
                            color="bg-emerald-500 text-white"
                        />
                    </div>
                    <div>
                        <StatCard
                            title="Monthly Outcome"
                            value={`${currencySymbol}${totalSpent.toLocaleString()}`}
                            change="+5.2%"
                            icon={ArrowDownRight}
                            color="bg-orange-500 text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Middle Grid: Portfolio and Savings Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* My Accounts */}
                <div>
                    <Card className="border-none shadow-sm h-full overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg font-black truncate">My Accounts</CardTitle>
                                {/* <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-0.5 truncate">Cash/Bank/Savings etc</p> */}
                            </div>
                            <AddAccountDialog variant="compact" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto custom-scrollbar smooth-scroll pr-2 pb-4">
                                {accounts.length === 0 ? (
                                    <div className="col-span-1 sm:col-span-2 text-center py-12 opacity-30 italic text-sm">
                                        No accounts added yet.
                                    </div>
                                ) : accounts.map((acc: any) => (
                                    <motion.div
                                        key={acc.id}
                                        layout
                                        whileHover={{ scale: 1.02, y: -2, zIndex: 10 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setDetailedAccount(acc);
                                            setAccountFilterMonth(filterMonth);
                                            setAccountFilterYear(filterYear);
                                        }}
                                        className={cn(
                                            "relative p-5 sm:p-4 rounded-[1.5rem] flex flex-col justify-between aspect-none sm:aspect-[1.1/1] min-h-[120px] sm:min-h-[140px] group transition-all duration-300 border-2 border-transparent hover:border-dashed hover:border-primary/30 cursor-pointer overflow-hidden shadow-sm",
                                            acc.type === 'Savings' ? "bg-[#E2F0D9] dark:bg-emerald-950/40" :
                                                acc.type === 'Investment' ? "bg-[#FFF2CC] dark:bg-amber-950/40" :
                                                    "bg-gray-100 dark:bg-white/10"
                                        )}
                                    >
                                        {/* Card Top: Icon & Delete */}
                                        <div className="flex items-start justify-between">
                                            <div className="h-8 w-8 bg-white/60 dark:bg-black/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm relative z-10">
                                                <DynamicIcon name={acc.icon || "Wallet"} className="h-4 w-4" />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity relative z-10" onClick={(e) => e.stopPropagation()}>
                                                <DeleteAccountButton id={acc.id} name={acc.name} />
                                            </div>
                                        </div>

                                        {/* Card Content: Balance & Name */}
                                        <div className="mt-4">
                                            <h4 className="text-lg font-black tracking-tighter truncate">
                                                {currencySymbol}{Number(acc.balance).toLocaleString()}
                                            </h4>
                                            <p className={cn(
                                                "text-[9px] font-black mt-1 uppercase tracking-[0.15em] truncate opacity-70",
                                                acc.type === 'Savings' ? "text-emerald-700 dark:text-emerald-400" :
                                                    acc.type === 'Investment' ? "text-amber-700 dark:text-amber-400" :
                                                        "text-muted-foreground"
                                            )}>
                                                {acc.name}
                                            </p>
                                        </div>

                                        {/* Decoration */}
                                        <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity translate-x-1 translate-y-1">
                                            <DynamicIcon name={acc.icon || "Wallet"} className="h-10 w-10 rotate-[-15deg]" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Ledger (Bento Middle) */}
                <div
                    className={cn(
                        "border-none shadow-sm lg:col-span-2 transition-all duration-500 dark:bg-white/5 rounded-[2rem] overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-md",
                        query && "ring-2 ring-primary ring-offset-2 dark:ring-offset-black shadow-2xl scale-[1.01]"
                    )}
                >
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
                            <div className="flex items-center gap-3 shrink-0">
                                <CardTitle className="text-xl font-black whitespace-nowrap">Recent Ledger</CardTitle>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                                {/* Segmented Control for Type */}
                                <div className="flex p-1 bg-gray-100/80 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 relative w-full md:w-auto shrink-0">
                                    {['all', 'income', 'expense'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setFilterType(t)}
                                            className={cn(
                                                "relative flex-1 md:flex-none md:min-w-[75px] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all z-10 flex items-center justify-center gap-1.5",
                                                filterType === t ? "text-white" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {filterType === t && (
                                                <motion.div
                                                    layoutId="ledgerTypePill"
                                                    className={cn(
                                                        "absolute inset-0 rounded-xl shadow-lg z-[-1]",
                                                        t === 'all' ? "bg-primary shadow-primary/20" :
                                                            t === 'income' ? "bg-emerald-500 shadow-emerald-500/20" :
                                                                "bg-orange-500 shadow-orange-500/20"
                                                    )}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            {t === 'income' && <ArrowUpRight className="h-3 w-3" />}
                                            {t === 'expense' && <ArrowDownRight className="h-3 w-3" />}
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="flex-1 md:flex-initial flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
                                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                                            <SelectTrigger className="h-8 min-w-[85px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-2">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem
                                                        key={cat.id}
                                                        value={cat.id}
                                                        className="text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 shrink-0" />

                                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                                            <SelectTrigger className="h-8 min-w-[95px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-2">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                {MONTHS.map((month, idx) => (
                                                    <SelectItem
                                                        key={month}
                                                        value={(idx + 1).toString().padStart(2, '0')}
                                                        className="text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        {month}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 shrink-0" />

                                        <Select value={filterYear} onValueChange={setFilterYear}>
                                            <SelectTrigger className="h-8 min-w-[70px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-2">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                {years.map(year => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year}
                                                        className="text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="shrink-0">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-2xl bg-gray-100/50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all border border-gray-200/50 dark:border-white/10"
                                                >
                                                    <Maximize2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-white/5 backdrop-blur-xl">
                                                <div className="p-4 sm:p-7 pb-2 flex flex-col gap-4">
                                                    <DialogHeader className="relative pr-12">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center">
                                                                <Calendar className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <DialogTitle className="text-xl sm:text-2xl font-black truncate">Transaction Ledger</DialogTitle>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                                    <span>{MONTHS[parseInt(filterMonth) - 1]} {filterYear}</span>
                                                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                                    <span>{filteredExpenses.length} Records</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogHeader>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Replicated Segmented Control - Fixed width for stability */}
                                                        <div className="flex p-1 bg-gray-100/80 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 relative shrink-0">
                                                            {['all', 'income', 'expense'].map((t) => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setFilterType(t)}
                                                                    className={cn(
                                                                        "relative min-w-[65px] sm:min-w-[80px] px-2 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all z-10 flex items-center justify-center gap-1.5",
                                                                        filterType === t ? "text-white" : "text-muted-foreground hover:text-foreground"
                                                                    )}
                                                                >
                                                                    {filterType === t && (
                                                                        <motion.div
                                                                            layoutId="ledgerTypePillPopup"
                                                                            className={cn(
                                                                                "absolute inset-0 rounded-xl shadow-lg z-[-1]",
                                                                                t === 'all' ? "bg-primary shadow-primary/20" :
                                                                                    t === 'income' ? "bg-emerald-500 shadow-emerald-500/20" :
                                                                                        "bg-orange-500 shadow-orange-500/20"
                                                                            )}
                                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                                        />
                                                                    )}
                                                                    {t === 'income' && <ArrowUpRight className="h-3 w-3" />}
                                                                    {t === 'expense' && <ArrowDownRight className="h-3 w-3" />}
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Simple Filters Replicated */}
                                                        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden shrink-0">
                                                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                                                <SelectTrigger className="h-8 min-w-[90px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-3 text-muted-foreground hover:text-foreground">
                                                                    <SelectValue placeholder="Category" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                    <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All</SelectItem>
                                                                    {categories.map((cat) => (
                                                                        <SelectItem
                                                                            key={cat.id}
                                                                            value={cat.id}
                                                                            className="text-[10px] font-black uppercase tracking-widest"
                                                                        >
                                                                            {cat.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>

                                                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 shrink-0" />

                                                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                                                <SelectTrigger className="h-8 min-w-[100px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-3 text-muted-foreground hover:text-foreground">
                                                                    <SelectValue placeholder="Month" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                    {MONTHS.map((month, idx) => (
                                                                        <SelectItem
                                                                            key={month}
                                                                            value={(idx + 1).toString().padStart(2, '0')}
                                                                            className="text-[10px] font-black uppercase tracking-widest"
                                                                        >
                                                                            {month}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>

                                                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 shrink-0" />

                                                            <Select value={filterYear} onValueChange={setFilterYear}>
                                                                <SelectTrigger className="h-8 min-w-[80px] border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-widest shadow-none px-3 text-muted-foreground hover:text-foreground">
                                                                    <SelectValue placeholder="Year" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                    {years.map(year => (
                                                                        <SelectItem
                                                                            key={year}
                                                                            value={year}
                                                                            className="text-[10px] font-black uppercase tracking-widest"
                                                                        >
                                                                            {year}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Download Button */}
                                                        <Button
                                                            onClick={handleDownloadPDF}
                                                            variant="outline"
                                                            className="h-10 rounded-2xl border-dashed border-primary/30 hover:border-primary shrink-0 gap-2 text-[10px] font-black uppercase tracking-widest px-4 ml-auto"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            <span>Export history</span>
                                                            <span className="opacity-50">.pdf</span>
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-hidden px-4 sm:px-7">
                                                    <LedgerList
                                                        expenses={filteredExpenses}
                                                        accounts={accounts}
                                                        currencySymbol={currencySymbol}
                                                        onAddAgain={handleAddAgain}
                                                        maxHeight="65vh"
                                                    />
                                                </div>
                                                {filteredExpenses.length > 0 && (
                                                    <div className="mt-auto px-4 sm:px-7 pb-4 sm:pb-7 pt-3 sm:pt-4 border-t border-dashed border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                                            </div>
                                                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">Snapshot Net Total</span>
                                                        </div>
                                                        <p className={cn(
                                                            "text-xl sm:text-2xl font-black tracking-tighter",
                                                            totalNet >= 0 ? "text-emerald-500" : "text-orange-500"
                                                        )}>
                                                            {totalNet >= 0 ? '+' : ''}{currencySymbol}{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Recent Transactions Modern List */}
                            <LedgerList
                                expenses={filteredExpenses}
                                accounts={accounts}
                                currencySymbol={currencySymbol}
                                maxHeight="700px"
                                onAddAgain={handleAddAgain}
                            />

                            {filteredExpenses.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Filter className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Month Net Total</span>
                                    </div>
                                    <p className={cn(
                                        "text-xl font-black tracking-tight",
                                        totalNet >= 0 ? "text-emerald-500" : "text-orange-500"
                                    )}>
                                        {totalNet >= 0 ? '+' : ''}{currencySymbol}{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Account Specific Ledger Modal */}
            <AnimatePresence>
                {detailedAccount && (
                    <Dialog open={!!detailedAccount} onOpenChange={(open) => !open && setDetailedAccount(null)}>
                        <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-white/5 backdrop-blur-xl outline-none overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full flex flex-col"
                            >
                                <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mb-6 pr-0 sm:pr-10 shrink-0">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <motion.div
                                            initial={{ scale: 0.8, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className={cn(
                                                "h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-6 shrink-0",
                                                detailedAccount?.type === 'Savings' ? "bg-[#E2F0D9] text-emerald-600 shadow-emerald-500/10" :
                                                    detailedAccount?.type === 'Investment' ? "bg-[#FFF2CC] text-amber-600 shadow-amber-500/10" :
                                                        "bg-gray-100 dark:bg-white/10 text-primary"
                                            )}
                                        >
                                            <DynamicIcon name={detailedAccount?.icon || "Wallet"} className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </motion.div>
                                        <div className="min-w-0">
                                            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight truncate">{detailedAccount?.name} History</DialogTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 opacity-70">
                                                    {detailedAccount?.type}
                                                </Badge>
                                                <span className="text-[8px] opacity-20">•</span>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                                    {MONTHS[parseInt(accountFilterMonth) - 1]} {accountFilterYear}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-2 bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl sm:rounded-[1.25rem] w-fit">
                                        <Select value={accountFilterMonth} onValueChange={setAccountFilterMonth}>
                                            <SelectTrigger className="h-8 sm:h-9 border-none bg-transparent focus:ring-0 text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-none px-2 sm:px-4">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {MONTHS.map((month, idx) => (
                                                    <SelectItem
                                                        key={month}
                                                        value={(idx + 1).toString().padStart(2, '0')}
                                                        className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
                                                    >
                                                        {month}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

                                        <Select value={accountFilterYear} onValueChange={setAccountFilterYear}>
                                            <SelectTrigger className="h-8 sm:h-9 border-none bg-transparent focus:ring-0 text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-none px-2 sm:px-4">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {years.map(year => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year}
                                                        className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </DialogHeader>

                                <div className="flex-1 overflow-hidden">
                                    <LedgerList
                                        expenses={accountDetailedExpenses}
                                        accounts={accounts}
                                        currencySymbol={currencySymbol}
                                        onAddAgain={handleAddAgain}
                                        maxHeight="65vh"
                                    />
                                </div>

                                {accountDetailedExpenses.length > 0 && (
                                    <div className="mt-auto pt-4 sm:pt-8 border-t border-dashed border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Account Monthly Performance</span>
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full shrink-0",
                                                    accountTotalNet >= 0 ? "bg-emerald-500 animate-pulse" : "bg-orange-500 animate-pulse"
                                                )} />
                                                <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest">
                                                    {accountTotalNet >= 0 ? 'Surplus' : 'Deficit'} for {MONTHS[parseInt(accountFilterMonth) - 1]}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <motion.p
                                                key={accountTotalNet}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className={cn(
                                                    "text-2xl sm:text-4xl font-black tracking-tighter leading-none",
                                                    accountTotalNet >= 0 ? "text-emerald-500" : "text-orange-500"
                                                )}
                                            >
                                                {accountTotalNet >= 0 ? '+' : ''}{currencySymbol}{accountTotalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </motion.p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        </div>
    );
}
