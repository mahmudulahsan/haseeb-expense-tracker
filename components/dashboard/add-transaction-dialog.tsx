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


interface AddTransactionDialogProps {
    accounts: any[];
    categories: any[];
}

export function AddTransactionDialog({ accounts, categories }: AddTransactionDialogProps) {
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
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
        const result = await parseVoiceTransaction(text);
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
            setOpen(false);
            setSelectedAccount("");
            setSelectedCategory("");
            setAmount("");
            setDescription("");
            setAiResult(null);
            setTranscript("");
            router.refresh();
        } else {

            console.error(result.error);
            alert(result.error || "Failed to add transaction");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full h-14 w-14 shadow-xl shadow-primary/20 p-0">
                    <Plus className="h-8 w-8" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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

                {/* AI Preview Section */}
                {(transcript || aiResult) && (
                    <div className="bg-primary/5 rounded-2xl p-3 space-y-2 border border-primary/10 animate-in fade-in slide-in-from-top-2 overflow-hidden relative group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60">
                                <Sparkles className="h-3 w-3" /> AI Preview
                            </div>
                            <button
                                type="button"
                                onClick={() => { setAiResult(null); setTranscript(""); }}
                                className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="h-3 w-3 opacity-30" />
                            </button>
                        </div>

                        {transcript && (
                            <p className="text-[10px] italic text-muted-foreground line-clamp-1 pr-6">
                                "{transcript}"
                            </p>
                        )}

                        {aiResult && (
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/50 dark:bg-black/20 px-2.5 py-1.5 rounded-xl border border-primary/5 flex items-center justify-between">
                                    <span className="text-[8px] uppercase font-bold opacity-40">Amt</span>
                                    <span className="text-xs font-black text-primary">${aiResult.amount}</span>
                                </div>
                                <div className="flex-1 bg-white/50 dark:bg-black/20 px-2.5 py-1.5 rounded-xl border border-primary/5 flex items-center justify-between overflow-hidden">
                                    <span className="text-[8px] uppercase font-bold opacity-40">Cat</span>
                                    <span className="text-xs font-bold truncate max-w-[80px] text-right">{aiResult.category}</span>
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
                            <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                                <SelectTrigger className="h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none font-medium">
                                    <SelectValue placeholder="Select Account..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="account_id" value={selectedAccount} required />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline px-2 py-1 rounded-lg bg-primary/5"
                                >
                                    {isCreatingCategory ? <><X className="h-3 w-3" /> Cancel</> : <><Plus className="h-3 w-3" /> New Category</>}
                                </button>
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
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        disabled={loading || !newCategoryName}
                                        className="bg-primary text-white h-12 w-12 rounded-2xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
                                    >
                                        <Check className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                                        <SelectTrigger className="h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none font-medium">
                                            <SelectValue placeholder="Select Category..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[200px] overflow-y-auto">
                                            {filteredCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                            placeholder="e.g. Starbucks Coffee"
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
            </DialogContent>
        </Dialog>
    );
}
