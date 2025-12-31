"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpCircle, ArrowDownCircle, Check, X, Mic, Loader2, Sparkles } from "lucide-react";
import { createTransaction, createCategory, parseVoiceTransaction } from "@/app/actions/finance";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "@/components/dashboard/searchable-select";
import { formatLocalDate } from "@/lib/date-utils";


interface AddTransactionDialogProps {
    accounts: any[];
    categories: any[];
    currencySymbol?: string;
}

export function AddTransactionDialog({ accounts, categories, currencySymbol = "$" }: AddTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<"income" | "expense">("expense");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Select states
    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    // Controlled inputs for AI pre-fill
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(formatLocalDate());

    // AI Voice states
    const [isListening, setIsListening] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResult, setAiResult] = useState<any>(null);
    const recognitionRef = useRef<any>(null);

    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "en-US";

                recognitionRef.current.onresult = async (event: any) => {
                    const text = event.results[0][0].transcript;
                    setTranscript(text);
                    setIsListening(false);
                    handleVoiceParse(text);
                };

                recognitionRef.current.onerror = () => setIsListening(false);
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, [accounts, categories]);

    async function handleVoiceParse(text: string) {
        setIsParsing(true);
        const result = await parseVoiceTransaction(text, formatLocalDate());
        if (result.success && result.aiResult) {
            const ai = result.aiResult;
            setAiResult(ai);

            // Auto-fill fields
            if (ai.amount) setAmount(ai.amount.toString());
            if (ai.description) setDescription(ai.description);
            if (ai.date) setDate(ai.date);
            if (ai.type) setType(ai.type === "income" ? "income" : "expense");

            // Look for matching account
            if (ai.account) {
                const matchAcc = accounts.find(a => a.name.toLowerCase() === ai.account.toLowerCase());
                if (matchAcc) setSelectedAccount(matchAcc.id);
            }

            // Look for matching category
            if (ai.category) {
                const matchCat = categories.find(c => c.name.toLowerCase() === ai.category.toLowerCase());
                if (matchCat) {
                    setSelectedCategory(matchCat.id);
                    setIsCreatingCategory(false);
                } else {
                    // Pre-fill new category name if it doesn't exist
                    setIsCreatingCategory(true);
                    setNewCategoryName(ai.category);
                }
            }
        }
        setIsParsing(false);
    }

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setAiResult(null);
            setTranscript("");
            recognitionRef.current.start();
            setIsListening(true);
        }
    };


    // Filter categories based on transaction type
    const filteredCategories = categories.filter(cat =>
        cat.type === type || cat.type === 'both' || !cat.type
    );

    async function handleAddCategory() {
        if (!newCategoryName) return;
        setLoading(true);
        const result = await createCategory(newCategoryName, type);
        if (result.success) {
            setNewCategoryName("");
            setIsCreatingCategory(false);
            router.refresh();
        } else {
            alert(result.error);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("type", type);

        // Manual append for Radix Selects if they aren't caught by FormData
        if (selectedAccount) formData.set("account_id", selectedAccount);
        if (selectedCategory) formData.set("category_id", selectedCategory);

        const result = await createTransaction(formData);

        if (result.success) {
            handleOpenChange(false);
            router.refresh();
        } else {
            console.error(result.error);
            alert(result.error || "Failed to add transaction");
            setLoading(false);
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset all fields when modal closes
            setAmount("");
            setDescription("");
            setDate(formatLocalDate());
            setSelectedAccount("");
            setSelectedCategory("");
            setAiResult(null);
            setTranscript("");
            setIsCreatingCategory(false);
            setNewCategoryName("");
            setType("expense");
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "group relative flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300",
                        "bg-white dark:bg-black/40 backdrop-blur-md shadow-lg hover:shadow-2xl border border-white/50 dark:border-white/10"
                    )}
                >
                    {/* Pulsing background effect */}
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse group-hover:bg-primary/30 transition-colors" />

                    <div className="relative flex items-center gap-2">
                        <motion.div
                            animate={{ rotate: open ? 45 : 0 }}
                            className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30"
                        >
                            <Plus className="h-5 w-5" />
                        </motion.div>
                        <span className="hidden sm:block text-sm font-black uppercase tracking-widest text-primary pr-1">
                            Add Transaction
                        </span>
                    </div>
                </motion.button>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-[425px] rounded-[2rem] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="px-6 pt-6 pb-2 shrink-0">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-12">
                        <DialogTitle>Add Transaction</DialogTitle>
                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={isParsing}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest",
                                isListening
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                        >
                            {isParsing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Mic className="h-3 w-3" />
                            )}
                            {isListening ? "Listening..." : isParsing ? "Analyzing..." : "Voice"}
                        </button>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {/* AI Preview Section */}
                    {(transcript || aiResult) && (
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-[1.5rem] p-4 space-y-3 border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative group shadow-sm mt-2">
                            {/* Decorative background glow */}
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI Preview</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setAiResult(null); setTranscript(""); }}
                                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                                </button>
                            </div>

                            {transcript && (
                                <p className="text-xs font-medium text-muted-foreground/80 italic leading-relaxed pl-1 border-l-2 border-primary/20 py-0.5">
                                    "{transcript}"
                                </p>
                            )}

                            {aiResult && (
                                <div className="flex gap-3 relative z-10 pt-1">
                                    <div className="flex-1 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-3 py-2 rounded-2xl border border-primary/10 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black opacity-30 tracking-tighter">Amount</span>
                                            <span className="text-sm font-black text-primary">{currencySymbol}{aiResult.amount}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-3 py-2 rounded-2xl border border-primary/10 flex items-center justify-between shadow-sm overflow-hidden">
                                        <div className="flex flex-col overflow-hidden w-full">
                                            <span className="text-[8px] uppercase font-black opacity-30 tracking-tighter text-right">Category</span>
                                            <span className="text-sm font-black truncate text-right">{aiResult.category}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Type Switcher */}
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl mt-4">
                        <button
                            type="button"
                            onClick={() => { setType("expense"); setIsCreatingCategory(false); setSelectedCategory(""); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                                type === "expense" ? "bg-white dark:bg-black shadow-sm text-orange-500" : "text-muted-foreground"
                            )}
                        >
                            <ArrowDownCircle className="h-4 w-4" />
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType("income"); setIsCreatingCategory(false); setSelectedCategory(""); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                                type === "income" ? "bg-white dark:bg-black shadow-sm text-emerald-500" : "text-muted-foreground"
                            )}
                        >
                            <ArrowUpCircle className="h-4 w-4" />
                            Income
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Amount</label>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-14 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 text-2xl font-black focus:ring-2 focus:ring-primary outline-none"
                                placeholder="0.00"
                            />

                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account</label>
                                <SearchableSelect
                                    options={accounts}
                                    value={selectedAccount}
                                    onValueChange={setSelectedAccount}
                                    placeholder="Select Account..."
                                />
                                <input type="hidden" name="account_id" value={selectedAccount} required />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                                    {!isCreatingCategory && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // We can still use the dialog's existing creation logic
                                                // but let the SearchableSelect handle the search
                                                setIsCreatingCategory(true);
                                            }}
                                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline px-2 py-1 rounded-lg bg-primary/5"
                                        >
                                            <Plus className="h-3 w-3" /> New Category
                                        </button>
                                    )}
                                </div>

                                {isCreatingCategory ? (
                                    <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                                        <input
                                            className="flex-1 h-12 bg-gray-100 dark:bg-white/5 border-2 border-primary/20 rounded-2xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                                            placeholder="Category name..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCategory();
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={handleAddCategory}
                                                disabled={loading || !newCategoryName}
                                                className="bg-primary text-white h-12 w-12 rounded-2xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreatingCategory(false)}
                                                className="bg-gray-100 dark:bg-white/10 text-muted-foreground h-12 w-12 rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <SearchableSelect
                                            options={filteredCategories}
                                            value={selectedCategory}
                                            onValueChange={setSelectedCategory}
                                            placeholder="Select Category..."
                                            onCreate={(name) => {
                                                setNewCategoryName(name);
                                                setIsCreatingCategory(true);
                                            }}
                                            createLabel="Add category"
                                        />
                                        <input type="hidden" name="category_id" value={selectedCategory} required />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Description <span className="text-[10px] opacity-40 lowercase">(Optional)</span>
                            </label>
                            <input
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none font-medium"
                                placeholder="e.g. Zakat, Sadaqah, or Eid Gifts"
                            />

                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Date</label>
                            <input
                                name="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none font-medium"
                            />
                        </div>


                        <Button type="submit" disabled={loading} className={cn(
                            "w-full h-14 text-lg font-bold shadow-xl transition-colors",
                            type === "income" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                        )}>
                            {loading ? "Saving..." : "Save Transaction"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
