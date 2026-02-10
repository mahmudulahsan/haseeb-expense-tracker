"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Target, Loader2, Check, Wallet, Laptop, Plane, Home, Heart } from "lucide-react";
import { createSavingsGoal } from "@/app/actions/savings";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddSavingsGoalDialogProps {
    currencySymbol?: string;
}

const ICONS = [
    { name: "Target", icon: Target },
    { name: "Wallet", icon: Wallet },
    { name: "Laptop", icon: Laptop },
    { name: "Plane", icon: Plane },
    { name: "Home", icon: Home },
    { name: "Heart", icon: Heart },
];

const COLORS = [
    "#ec4899", // pink-500
    "#8b5cf6", // violet-500
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#6366f1", // indigo-500
];

export function AddSavingsGoalDialog({
    currencySymbol = "$"
}: AddSavingsGoalDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState("Target");
    const [selectedColor, setSelectedColor] = useState("#ec4899");

    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("icon", selectedIcon);
        formData.append("color", selectedColor);

        const result = await createSavingsGoal(formData);

        if (result.success) {
            setOpen(false);
            toast.success("Savings goal created successfully");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create goal");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className={cn(
                        "group relative flex flex-col items-center justify-center gap-4 w-full h-full min-h-[160px] rounded-[2.5rem] transition-all duration-300",
                        "bg-white dark:bg-black/40 backdrop-blur-xl shadow-xl hover:shadow-2xl border border-white dark:border-white/5 active:scale-95"
                    )}
                >
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-pink-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 transition-transform duration-300">
                            <Plus className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <span className="block text-sm font-black uppercase tracking-[0.2em] text-pink-500">
                                New Goal
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1 block">
                                Start saving today
                            </span>
                        </div>
                    </div>
                </button>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-[440px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#0A0A0A]">
                <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-violet-600 px-10 py-12 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Target className="h-6 w-6 text-white" />
                            </div>
                            Target Savings
                        </DialogTitle>
                        <p className="text-white/80 text-sm font-medium mt-2">What are you planning for your future?</p>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-10 py-10 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Goal Name</label>
                            <input
                                name="name"
                                required
                                className="w-full h-16 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-pink-500/30 focus:bg-white dark:focus:bg-black rounded-[1.5rem] px-6 text-base font-bold outline-none transition-all shadow-sm"
                                placeholder="e.g. Dream Laptop, Umrah Trip..."
                            />
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-pink-500 opacity-50">{currencySymbol}</span>
                                <input
                                    name="target_amount"
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full h-16 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-pink-500/30 focus:bg-white dark:focus:bg-black rounded-[1.5rem] pl-14 pr-6 text-3xl font-black outline-none transition-all shadow-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Personalize</label>
                            <div className="flex flex-wrap gap-2.5">
                                {ICONS.map((item) => (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setSelectedIcon(item.name)}
                                        className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                            selectedIcon === item.name
                                                ? "bg-pink-500 text-white shadow-lg scale-110"
                                                : "bg-gray-50 dark:bg-white/5 text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <item.icon className="h-6 w-6" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Theme Color</label>
                            <div className="flex flex-wrap gap-4 px-1">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={cn(
                                            "h-9 w-9 rounded-full transition-all duration-300 border-[3px]",
                                            selectedColor === color
                                                ? "border-pink-500/20 scale-125 shadow-lg ring-4 ring-pink-500/10"
                                                : "border-transparent opacity-50 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {selectedColor === color && <Check className="h-4 w-4 text-white mx-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-[1.5rem] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-pink-500/20 transition-all active:scale-95 text-xs"
                    >
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            "Create Saving Goal"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
