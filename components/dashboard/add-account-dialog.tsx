"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, PiggyBank, Briefcase, CreditCard, Landmark, Coins, Globe, Heart, Shield } from "lucide-react";
import { createAccount } from "@/app/actions/finance";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS = [
    { name: "Wallet", icon: Wallet },
    { name: "PiggyBank", icon: PiggyBank },
    { name: "Briefcase", icon: Briefcase },
    { name: "CreditCard", icon: CreditCard },
    { name: "Landmark", icon: Landmark },
    { name: "Coins", icon: Coins },
    { name: "Globe", icon: Globe },
    { name: "Heart", icon: Heart },
    { name: "Shield", icon: Shield },
];

interface AddAccountDialogProps {
    variant?: 'full' | 'compact';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialName?: string;
    onSuccess?: (account: any) => void;
}

export function AddAccountDialog({
    variant = 'full',
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    initialName = "",
    onSuccess
}: AddAccountDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState("Wallet");
    const [selectedType, setSelectedType] = useState("Current");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("icon", selectedIcon);
        formData.set("type", selectedType);

        const result = await createAccount(formData);

        if (result.success) {
            setOpen(false);
            toast.success("Account created successfully");
            router.refresh();
            if (onSuccess && result.account) {
                onSuccess(result.account);
            }
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {variant !== 'compact' && controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-16 border-dashed border-2 rounded-[1.5rem] mt-2 gap-2 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                        <Plus className="h-5 w-5" />
                        New Account
                    </Button>
                </DialogTrigger>
            )}
            {variant === 'compact' && controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-100/50 dark:bg-white/5 hover:bg-primary/20 hover:text-primary transition-all">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="w-[95%] sm:max-w-[425px] rounded-[2rem] p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Icon</label>
                        <div className="grid grid-cols-5 gap-2">
                            {ICONS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setSelectedIcon(item.name)}
                                        className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                            selectedIcon === item.name
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                                                : "bg-gray-100 dark:bg-white/5 text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Name</label>
                        <input
                            name="name"
                            required
                            defaultValue={initialName}
                            className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. My Savings"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none font-medium text-left">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    <SelectItem value="Current">Current</SelectItem>
                                    <SelectItem value="Savings">Savings</SelectItem>
                                    <SelectItem value="Investment">Investment</SelectItem>
                                    <SelectItem value="Wallet">Wallet</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="type" value={selectedType} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Initial Balance</label>
                            <input
                                name="balance"
                                type="number"
                                step="0.01"
                                required
                                className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-4 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">
                        {loading ? "Creating..." : "Create Account"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
