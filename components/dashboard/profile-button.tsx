"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleUser, LogOut, Settings, User, KeyRound, ShieldCheck, DollarSign } from "lucide-react";
import { updateProfile, signUserOut } from "@/app/actions/finance";
import { changePassword } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProfileButtonProps {
    initialName?: string;
    initialCurrency?: string;
    email?: string;
}

export function ProfileButton({ initialName, initialCurrency, email }: ProfileButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(initialName || "");
    const [currency, setCurrency] = useState(initialCurrency || "USD");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await updateProfile(formData);

        if (result.success) {
            setOpen(false);
            router.refresh();
        } else {
            setError(result.error || "Failed to update profile");
        }
        setLoading(false);
    }

    async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await changePassword(formData);

        if (result.success) {
            alert("Password updated successfully!");
            setOpen(false);
        } else {
            setError(result.error || "Failed to update password");
        }
        setLoading(false);
    }

    async function handleLogout() {
        setLoading(true);
        try {
            await signUserOut();
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "/login";
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); setError(null); }}>
            <DialogTrigger asChild>
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="h-full w-full rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                        <CircleUser className="h-6 w-6 text-gray-400" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-[425px] p-0 overflow-hidden border-none bg-white dark:bg-white/5 backdrop-blur-xl max-h-[90vh] flex flex-col shadow-2xl rounded-[2.5rem]">
                <DialogHeader className="p-8 pb-4 shrink-0">
                    <DialogTitle className="text-2xl font-black tracking-tight">Account Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full flex-1 flex flex-col min-h-0">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-8 h-12 gap-8 shrink-0">
                        <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
                            General
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
                            Security
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto pr-8 pl-8 pb-8 pt-4 scrollbar-none scroll-smooth">
                        {error && (
                            <div className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-500 border border-red-500/20 animate-in shake-in">
                                {error}
                            </div>
                        )}

                        <TabsContent value="general" className="mt-0 space-y-8 focus-visible:outline-none">
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            name="displayName"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full h-14 bg-gray-50 dark:bg-white/5 border-none rounded-[1.25rem] pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-medium transition-all"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Currency</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                        <input type="hidden" name="currency" value={currency} />
                                        <Select value={currency} onValueChange={setCurrency}>
                                            <SelectTrigger className="w-full h-14 bg-gray-50 dark:bg-white/5 border-none rounded-[1.25rem] pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-medium transition-all">
                                                <SelectValue placeholder="Select Currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BDT">৳ BDT - Bangladeshi Taka</SelectItem>
                                                <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                                                <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                                                <SelectItem value="JPY">¥ JPY - Japanese Yen</SelectItem>
                                                <SelectItem value="INR">₹ INR - Indian Rupee</SelectItem>
                                                <SelectItem value="AUD">$ AUD - Australian Dollar</SelectItem>
                                                <SelectItem value="CAD">$ CAD - Canadian Dollar</SelectItem>
                                                <SelectItem value="CNY">¥ CNY - Chinese Yuan</SelectItem>
                                                <SelectItem value="PKR">Rs PKR - Pakistani Rupee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full h-14 rounded-[1.25rem] font-black shadow-xl shadow-primary/20 text-base">
                                    {loading ? "Updating..." : "Save Profile"}
                                </Button>
                            </form>

                            <div className="h-px bg-gray-100 dark:bg-white/5 w-full" />

                            <div className="flex flex-col gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={loading}
                                    className="w-full h-14 rounded-[1.25rem] font-bold text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors justify-start gap-3 px-5"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-5 w-5" />
                                    {loading && !name ? "Logging out..." : "Logout"}
                                </Button>
                                {email && (
                                    <p className="text-[10px] font-bold text-muted-foreground/40 tracking-widest text-center">{email}</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="security" className="mt-0 space-y-6 focus-visible:outline-none">
                            <div className="mb-2">
                                <h4 className="text-base font-bold">Update Password</h4>
                                <p className="text-[11px] text-muted-foreground font-medium">Protect your dashboard with a strong password</p>
                            </div>
                            <form onSubmit={handlePasswordChange} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Current Password</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                name="currentPassword"
                                                type="password"
                                                className="w-full h-12 bg-gray-50 dark:bg-white/5 border-none rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-medium text-sm transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">New Password</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                name="newPassword"
                                                type="password"
                                                required
                                                className="w-full h-12 bg-gray-50 dark:bg-white/5 border-none rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-medium text-sm transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Confirm New Password</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                required
                                                className="w-full h-12 bg-gray-100 dark:bg-white/5 border-none rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-medium text-sm transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full h-14 rounded-[1.25rem] font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-base">
                                    {loading ? "Updating..." : "Reset Password"}
                                </Button>
                            </form>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
