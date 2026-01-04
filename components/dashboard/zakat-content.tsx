"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Heart, Info, Landmark, Briefcase, Home, Sprout, Receipt, AlertCircle, HandHeart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateZakatTarget } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Trash2 } from "lucide-react";
import { parseLocalDate } from "@/lib/date-utils";

interface ZakatSectionProps {
    title: string;
    icon: any;
    color: string;
    children: React.ReactNode;
}

function ZakatSection({ title, icon: Icon, color, children }: ZakatSectionProps) {
    return (
        <Card className="border-none shadow-sm overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg", color)}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg font-black">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

interface ZakatInputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    currencySymbol: string;
}

function ZakatInput({ label, value, onChange, placeholder = "0.00", currencySymbol }: ZakatInputProps) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black opacity-30">
                    {currencySymbol}
                </span>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl pl-10 pr-4 text-sm font-black focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}

export function ZakatContent({
    currencySymbol,
    zakatTarget,
    expenses = [],
    categories = []
}: {
    currencySymbol: string;
    zakatTarget: number;
    expenses?: any[];
    categories?: any[];
}) {
    // Cash Amount
    const [cashInHand, setCashInHand] = useState("");
    const [cashInBank, setCashInBank] = useState("");

    // Gold & Silver
    const [goldValue, setGoldValue] = useState("");
    const [silverValue, setSilverValue] = useState("");

    // Investment
    const [stockMarket, setStockMarket] = useState("");
    const [otherInvestments, setOtherInvestments] = useState("");

    // Property
    const [rentalIncome, setRentalIncome] = useState("");
    const [otherProperty, setOtherProperty] = useState("");

    // Business
    const [businessSavings, setBusinessSavings] = useState("");
    const [businessInventory, setBusinessInventory] = useState("");

    // Others
    const [pensionIncome, setPensionIncome] = useState("");
    const [receivables, setReceivables] = useState("");
    const [otherCapital, setOtherCapital] = useState("");

    // Agriculture
    const [agricultureIncome, setAgricultureIncome] = useState("");

    // Liabilities
    const [creditCardDebt, setCreditCardDebt] = useState("");
    const [carLoan, setCarLoan] = useState("");
    const [businessLoan, setBusinessLoan] = useState("");
    const [familyLoan, setFamilyLoan] = useState("");
    const [otherLoans, setOtherLoans] = useState("");

    const totalAssets = useMemo(() => {
        return (
            Number(cashInHand) +
            Number(cashInBank) +
            Number(goldValue) +
            Number(silverValue) +
            Number(stockMarket) +
            Number(otherInvestments) +
            Number(rentalIncome) +
            Number(otherProperty) +
            Number(businessSavings) +
            Number(businessInventory) +
            Number(pensionIncome) +
            Number(receivables) +
            Number(otherCapital) +
            Number(agricultureIncome)
        );
    }, [
        cashInHand, cashInBank, goldValue, silverValue, stockMarket,
        otherInvestments, rentalIncome, otherProperty, businessSavings,
        businessInventory, pensionIncome, receivables, otherCapital, agricultureIncome
    ]);

    const totalLiabilities = useMemo(() => {
        return (
            Number(creditCardDebt) +
            Number(carLoan) +
            Number(businessLoan) +
            Number(familyLoan) +
            Number(otherLoans)
        );
    }, [creditCardDebt, carLoan, businessLoan, familyLoan, otherLoans]);

    const breakdown = useMemo(() => {
        const fields = [
            { label: "Cash in Hand", value: Number(cashInHand), icon: Coins, color: "text-emerald-400" },
            { label: "Cash in Bank", value: Number(cashInBank), icon: Coins, color: "text-emerald-400" },
            { label: "Gold Value", value: Number(goldValue), icon: Landmark, color: "text-amber-400" },
            { label: "Silver Value", value: Number(silverValue), icon: Landmark, color: "text-amber-400" },
            { label: "Stock Market", value: Number(stockMarket), icon: Briefcase, color: "text-blue-400" },
            { label: "Other Investments", value: Number(otherInvestments), icon: Briefcase, color: "text-blue-400" },
            { label: "Rental Income", value: Number(rentalIncome), icon: Home, color: "text-purple-400" },
            { label: "Other Property", value: Number(otherProperty), icon: Home, color: "text-purple-400" },
            { label: "Business Savings", value: Number(businessSavings), icon: Receipt, color: "text-rose-400" },
            { label: "Business Inventory", value: Number(businessInventory), icon: Receipt, color: "text-rose-400" },
            { label: "Agriculture", value: Number(agricultureIncome), icon: Sprout, color: "text-lime-400" },
            { label: "Pension", value: Number(pensionIncome), icon: Info, color: "text-slate-400" },
            { label: "Receivables", value: Number(receivables), icon: Info, color: "text-slate-400" },
            { label: "Other Capital", value: Number(otherCapital), icon: Info, color: "text-slate-400" },
            { label: "Credit Card Debt", value: Number(creditCardDebt), icon: AlertCircle, color: "text-orange-400", isNegative: true },
            { label: "Car Loan", value: Number(carLoan), icon: AlertCircle, color: "text-orange-400", isNegative: true },
            { label: "Business Loan", value: Number(businessLoan), icon: AlertCircle, color: "text-orange-400", isNegative: true },
            { label: "Family Loan", value: Number(familyLoan), icon: AlertCircle, color: "text-orange-400", isNegative: true },
            { label: "Other Loans", value: Number(otherLoans), icon: AlertCircle, color: "text-orange-400", isNegative: true },
        ];
        return fields.filter(f => f.value > 0);
    }, [
        cashInHand, cashInBank, goldValue, silverValue, stockMarket,
        otherInvestments, rentalIncome, otherProperty, businessSavings,
        businessInventory, pensionIncome, receivables, otherCapital, agricultureIncome,
        creditCardDebt, carLoan, businessLoan, familyLoan, otherLoans
    ]);

    const netWealth = Math.max(0, totalAssets - totalLiabilities);
    const zakatAmount = netWealth * 0.025;

    const zakatStats = useMemo(() => {
        if (zakatTarget <= 0) return null;

        const currentYear = new Date().getFullYear();
        const zakatCategoryIds = categories
            .filter(c => c.name.toLowerCase().includes("zakat"))
            .map(c => c.id);

        const paid = expenses
            .filter(e => {
                const isZakat = zakatCategoryIds.includes(e.category_id);
                if (!isZakat) return false;
                const expenseDate = typeof e.date === 'string' ? parseLocalDate(e.date) : e.date;
                return expenseDate.getFullYear() === currentYear;
            })
            .reduce((acc, curr) => acc + curr.amount, 0);

        const progress = Math.min(100, (paid / zakatTarget) * 100);
        const remaining = Math.max(0, zakatTarget - paid);

        return { paid, progress, remaining, currentYear };
    }, [expenses, categories, zakatTarget]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSaveToDashboard = async () => {
        setIsSaving(true);
        const result = await updateZakatTarget(zakatAmount);
        setIsSaving(false);
        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Info */}
            <div className="relative overflow-hidden rounded-[2rem] bg-primary/10 p-8 border border-primary/20">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <HandHeart className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Zakat Calculator {new Date().getFullYear()}</h1>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground max-w-xl">
                            Provide your asset information for the whole year to calculate your Zakat.
                        </p>
                    </div>
                    <div className="flex items-start gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white dark:border-white/5 max-w-sm">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                            Zakat calculations of this app should not be solely relied upon. Please consult with an Aleem for more precise and accurate guidance.
                        </p>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: All Input Sections */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <ZakatSection title="Cash Amount" icon={Coins} color="bg-emerald-500">
                                <ZakatInput label="Cash in Hand" value={cashInHand} onChange={setCashInHand} currencySymbol={currencySymbol} />
                                <ZakatInput label="Cash in Bank Accounts" value={cashInBank} onChange={setCashInBank} currencySymbol={currencySymbol} />
                            </ZakatSection>

                            <ZakatSection title="Gold & Silver" icon={Landmark} color="bg-amber-500">
                                <ZakatInput label="Value of Gold" value={goldValue} onChange={setGoldValue} currencySymbol={currencySymbol} />
                                <ZakatInput label="Value of Silver" value={silverValue} onChange={setSilverValue} currencySymbol={currencySymbol} />
                            </ZakatSection>

                            <ZakatSection title="Investments" icon={Briefcase} color="bg-blue-500">
                                <ZakatInput label="Stock Market" value={stockMarket} onChange={setStockMarket} currencySymbol={currencySymbol} />
                                <ZakatInput label="Other Investments" value={otherInvestments} onChange={setOtherInvestments} currencySymbol={currencySymbol} />
                            </ZakatSection>

                            <ZakatSection title="Property" icon={Home} color="bg-purple-500">
                                <ZakatInput label="Income from House Rent" value={rentalIncome} onChange={setRentalIncome} currencySymbol={currencySymbol} />
                                <ZakatInput label="Other Property" value={otherProperty} onChange={setOtherProperty} currencySymbol={currencySymbol} />
                            </ZakatSection>

                            <ZakatSection title="Business Income" icon={Receipt} color="bg-rose-500">
                                <ZakatInput label="Business Savings" value={businessSavings} onChange={setBusinessSavings} currencySymbol={currencySymbol} />
                                <ZakatInput label="Business Inventory" value={businessInventory} onChange={setBusinessInventory} currencySymbol={currencySymbol} />
                            </ZakatSection>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <ZakatSection title="Liabilities" icon={AlertCircle} color="bg-orange-500">
                                <ZakatInput label="Credit Card Debt" value={creditCardDebt} onChange={setCreditCardDebt} currencySymbol={currencySymbol} />
                                <ZakatInput label="Car Loan" value={carLoan} onChange={setCarLoan} currencySymbol={currencySymbol} />
                                <ZakatInput label="Business Loan" value={businessLoan} onChange={setBusinessLoan} currencySymbol={currencySymbol} />
                                <ZakatInput label="Family Loan" value={familyLoan} onChange={setFamilyLoan} currencySymbol={currencySymbol} />
                                <ZakatInput label="Other Loans" value={otherLoans} onChange={setOtherLoans} currencySymbol={currencySymbol} />
                            </ZakatSection>

                            <ZakatSection title="Agriculture" icon={Sprout} color="bg-lime-600">
                                <ZakatInput label="Income from Agriculture" value={agricultureIncome} onChange={setAgricultureIncome} currencySymbol={currencySymbol} />
                            </ZakatSection>

                            <ZakatSection title="Others" icon={Info} color="bg-slate-500">
                                <ZakatInput label="Pension Income" value={pensionIncome} onChange={setPensionIncome} currencySymbol={currencySymbol} />
                                <ZakatInput label="Receivables" value={receivables} onChange={setReceivables} currencySymbol={currencySymbol} />
                                <ZakatInput label="Other Capital" value={otherCapital} onChange={setOtherCapital} currencySymbol={currencySymbol} />
                            </ZakatSection>
                        </div>
                    </div>
                </div>

                {/* Right Column: Result / Summary */}
                <div className="space-y-6">
                    {/* Result Card */}
                    <Card className="border-none shadow-2xl bg-sky-600 dark:bg-sky-900/40 text-white overflow-hidden relative group sticky top-8">
                        <CardHeader>
                            <CardTitle className="text-xl font-black uppercase tracking-widest opacity-60">Zakat Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center opacity-80">
                                    <span className="text-xs font-bold uppercase tracking-widest">Total Assets</span>
                                    <span className="text-lg font-black">{currencySymbol}{totalAssets.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center opacity-80">
                                    <span className="text-xs font-bold uppercase tracking-widest">Total Liabilities</span>
                                    <span className="text-lg font-black">-{currencySymbol}{totalLiabilities.toLocaleString()}</span>
                                </div>
                                <div className="h-[1px] bg-white/10 w-full" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Net Zakat Wealth</span>
                                    <span className="text-2xl font-black text-white">{currencySymbol}{netWealth.toLocaleString()}</span>
                                </div>
                            </div>

                            <motion.div
                                key={zakatAmount}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] space-y-1 relative overflow-hidden border border-white/10 shadow-inner"
                            >
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <Heart className="h-24 w-24 rotate-12" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Zakat Payable</span>
                                <div className="text-4xl font-black tracking-tighter">
                                    {currencySymbol}{zakatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest pt-2">
                                    2.5% of net wealth
                                </p>
                            </motion.div>

                            {zakatTarget > 0 && zakatStats && (
                                <>
                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/10 flex items-center justify-between gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Active Target ({zakatStats.currentYear})</span>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Are you sure you want to reset your Zakat target?")) {
                                                            await updateZakatTarget(0);
                                                        }
                                                    }}
                                                    className="text-white/40 hover:text-white/100 transition-colors ml-2"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="text-2xl font-black">{currencySymbol}{zakatTarget.toLocaleString()}</div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                                    {currencySymbol}{zakatStats.paid.toLocaleString()} Paid
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pie Chart */}
                                        <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    className="text-white/5"
                                                />
                                                <motion.circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke="#10b981"
                                                    strokeWidth="12"
                                                    strokeDasharray="251.32"
                                                    strokeDashoffset={251.32 - (251.32 * zakatStats.progress) / 100}
                                                    strokeLinecap="round"
                                                    initial={{ strokeDashoffset: 251.32 }}
                                                    animate={{ strokeDashoffset: 251.32 - (251.32 * zakatStats.progress) / 100 }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-black">{Math.round(zakatStats.progress)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {breakdown.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 px-1">Wealth Breakdown</p>
                                            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                {breakdown.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors group/item">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center transition-transform group-hover/item:scale-110", item.color)}>
                                                                <item.icon className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-[10px] sm:text-[11px] font-bold opacity-70 group-hover/item:opacity-100 transition-opacity">{item.label}</span>
                                                        </div>
                                                        <span className={cn("text-[11px] sm:text-xs font-black tracking-tight", item.isNegative ? "text-orange-400" : "text-white")}>
                                                            {item.isNegative ? "-" : ""}{currencySymbol}{item.value.toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <Button
                                onClick={handleSaveToDashboard}
                                disabled={isSaving || zakatAmount <= 0}
                                className={cn(
                                    "w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    saveSuccess ? "bg-emerald-500 hover:bg-emerald-600" : "bg-white/10 hover:bg-white/20 text-white"
                                )}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : saveSuccess ? (
                                    <Check className="h-4 w-4 mr-2" />
                                ) : null}
                                {saveSuccess ? "Saved to Dashboard" : "Sync with Dashboard"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
