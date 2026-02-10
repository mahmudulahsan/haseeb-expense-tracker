"use client";

import { useState } from "react";
import { SavingsGoal } from "@/lib/validations/savings";
import { AddSavingsGoalDialog } from "./add-savings-goal-dialog";
import { addSavingsProgress, deleteSavingsGoal } from "@/app/actions/savings";
import {
    Plus,
    Trash2,
    Target,
    TrendingUp,
    Wallet,
    Laptop,
    Plane,
    Home,
    Heart,
    ChevronRight,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SavingsContentProps {
    currencySymbol: string;
    savingsData: { goals: SavingsGoal[] };
}

const ICON_MAP: Record<string, any> = {
    PiggyBank: Target, // Fallback to Target if PiggyBank was selected
    Target: Target,
    Wallet: Wallet,
    Laptop: Laptop,
    Plane: Plane,
    Home: Home,
    Heart: Heart,
};

export function SavingsContent({ currencySymbol, savingsData }: SavingsContentProps) {
    const goals = savingsData.goals || [];
    const router = useRouter();
    const [isAddingProgress, setIsAddingProgress] = useState<string | null>(null);
    const [progressAmount, setProgressAmount] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleAddProgress(goalId: string) {
        if (!progressAmount || isNaN(Number(progressAmount))) return;

        setLoading(true);
        const result = await addSavingsProgress(goalId, Number(progressAmount));

        if (result.success) {
            setIsAddingProgress(null);
            setProgressAmount("");
            toast.success("Progress added!");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to add progress");
        }
        setLoading(false);
    }

    async function handleDeleteGoal(goalId: string) {
        if (!confirm("Are you sure you want to delete this goal?")) return;

        const result = await deleteSavingsGoal(goalId);
        if (result.success) {
            toast.success("Goal deleted");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete goal");
        }
    }

    const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
    const totalCurrent = goals.reduce((acc, g) => acc + g.current_amount, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                {/* Main Summary Card */}
                <div className="flex-1 bg-white dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 dark:border-white/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-colors duration-1000" />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-4 relative z-10 h-full">
                        <div className="space-y-4 text-center sm:text-left">
                            <h2 className="text-4xl font-black uppercase tracking-tight">Your Savings</h2>
                            <p className="text-muted-foreground font-medium text-base">
                                You've saved <span className="text-pink-500 font-black">{currencySymbol}{totalCurrent.toLocaleString()}</span> of your <span className="font-bold">{currencySymbol}{totalTarget.toLocaleString()}</span> goal
                            </p>
                        </div>

                        <div className="flex items-center gap-8 shrink-0">
                            <div className="text-right">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 mb-1">Overall Progress</span>
                                <span className="text-6xl font-black text-pink-500 italic tabular-nums leading-none">
                                    {Math.round(overallProgress)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Goal Side Card */}
                <div className="lg:w-[320px] flex items-center justify-center">
                    <AddSavingsGoalDialog currencySymbol={currencySymbol} />
                </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {goals.map((goal) => {
                    const Icon = ICON_MAP[goal.icon] || Target;
                    const progress = (goal.current_amount / goal.target_amount) * 100;

                    return (
                        <div
                            key={goal.id}
                            className="group relative bg-white dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
                        >
                            {/* Goal Color Accents */}
                            <div
                                className="absolute top-8 right-8 w-12 h-12 rounded-2xl opacity-10 blur-xl transition-all duration-700 pointer-events-none"
                                style={{ backgroundColor: goal.color }}
                            />

                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-6">
                                    <div
                                        className="h-16 w-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg transition-all duration-500"
                                        style={{ backgroundColor: goal.color, boxShadow: `0 10px 25px -5px ${goal.color}50` }}
                                    >
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight leading-none truncate max-w-[140px]">{goal.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Saving Target</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="p-2 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all relative z-20"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex items-end justify-between mb-8">
                                <div className="space-y-1">
                                    <p className="text-3xl font-black tabular-nums tracking-tighter">
                                        {currencySymbol}{goal.current_amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs font-bold text-muted-foreground opacity-60">
                                        of {currencySymbol}{goal.target_amount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className="text-2xl font-black tracking-tighter tabular-nums" style={{ color: goal.color }}>
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto space-y-6">
                                {/* Progress Bar */}
                                <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            backgroundColor: goal.color,
                                            width: `${Math.min(100, progress)}%`
                                        }}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Dialog
                                        open={isAddingProgress === goal.id}
                                        onOpenChange={(open) => !open && setIsAddingProgress(null)}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsAddingProgress(goal.id)}
                                                className="flex-1 h-14 rounded-2xl border-none bg-gray-50 dark:bg-white/5 font-black uppercase tracking-[0.15em] text-[10px] hover:bg-gray-100 dark:hover:bg-white/10 transition-all shadow-sm"
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Add Money
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[3rem] p-10 border-none shadow-2xl overflow-hidden max-w-[400px]">
                                            {/* Background decoration */}
                                            <div className="absolute -right-20 -top-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                                            <DialogHeader className="relative z-10 mb-6">
                                                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                                                        <TrendingUp className="h-6 w-6 text-pink-500" />
                                                    </div>
                                                    Add to "{goal.name}"
                                                </DialogTitle>
                                            </DialogHeader>

                                            <div className="relative z-10 space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-2">Amount to deposit</label>
                                                    <div className="relative">
                                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-pink-500">{currencySymbol}</span>
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            value={progressAmount}
                                                            onChange={(e) => setProgressAmount(e.target.value)}
                                                            className="w-full h-16 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-pink-500/30 focus:bg-white dark:focus:bg-black rounded-3xl pl-14 pr-8 text-3xl font-black outline-none transition-all shadow-inner"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => handleAddProgress(goal.id)}
                                                    disabled={loading || !progressAmount}
                                                    className="w-full h-16 rounded-3xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-pink-500/20 transition-all"
                                                >
                                                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm Deposit"}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <button
                                        className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all"
                                        title="View Details"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full py-24 text-center space-y-6">
                        <div className="h-32 w-32 bg-gray-100 dark:bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-4 border border-white/50 dark:border-white/5 shadow-inner">
                            <Target className="h-14 w-14 text-muted-foreground/20" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tight opacity-40">No savings goals yet</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm leading-relaxed">
                                Don't let your dreams be dreams. Set your first goal and start building your future today!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
