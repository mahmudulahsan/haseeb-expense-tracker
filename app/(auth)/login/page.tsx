"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Mail, KeyRound, ArrowRight } from "lucide-react";
import { setPassword, loginWithPassword } from "@/app/actions/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPasswordState] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Set Password, 4: Login Password
    const [isForgot, setIsForgot] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setIsForgot(false);

        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else if (data.passwordRequired) {
                setStep(4);
            } else {
                setStep(2);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/otp/verify", {
                method: "POST",
                body: JSON.stringify({ email, code: otp, isForgot }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else if (data.needsPassword) {
                setStep(3);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Invalid code or connection error.");
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);

        const result = await setPassword(formData);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    const handleLoginPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        const result = await loginWithPassword(formData);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    const handleForgotPassword = async () => {
        setLoading(true);
        setError(null);
        setIsForgot(true);

        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                body: JSON.stringify({ email, allowForgot: true }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setStep(2); // Go to OTP verification
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F9F7F2] dark:bg-[#0A0A0A] px-4 overflow-hidden relative">
            {/* Background Decorative Element */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animae-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px]" />

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl relative z-10 p-4 transition-all duration-500">
                <CardContent className="pt-10 pb-6 px-6 sm:px-10">
                    <div className="flex justify-center mb-8">
                        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <PiggyBank className="h-10 w-10" />
                        </div>
                    </div>

                    <div className="text-center space-y-2 mb-10">
                        <h2 className="text-3xl font-black tracking-tight">
                            {step === 1 && "Welcome Back"}
                            {step === 2 && "Verify Identification"}
                            {step === 3 && "Reset Your Password"}
                            {step === 4 && "Enter Password"}
                        </h2>
                        <p className="text-muted-foreground font-medium">
                            {step === 1 && "Experience the premium expense tracking"}
                            {step === 2 && `Enter the code we sent to ${email}`}
                            {step === 3 && "Create a new strong password for your account"}
                            {step === 4 && "Enter your password to access your dashboard"}
                        </p>
                    </div>

                    {error && (
                        <Badge variant="destructive" className="w-full justify-center py-3 rounded-xl mb-6 font-bold tracking-wide animate-in shake-in">
                            {error}
                        </Badge>
                    )}

                    {step === 1 && (
                        <form className="space-y-6" onSubmit={handleSendOtp}>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    className="w-full h-14 bg-gray-100/50 dark:bg-white/5 border-none rounded-2xl px-12 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 group">
                                {loading ? "Checking..." : "Continue"}
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="space-y-6" onSubmit={handleVerifyOtp}>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full h-14 bg-gray-100/50 dark:bg-white/5 border-none rounded-2xl px-12 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                />
                            </div>

                            <div className="space-y-3">
                                <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">
                                    {loading ? "Verifying..." : "Verify Identity"}
                                </Button>
                                <button type="button" onClick={() => setStep(1)} className="w-full text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                                    ← Use a different email
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form className="space-y-6" onSubmit={handleSetPassword}>
                            <div className="space-y-4">
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full h-14 bg-gray-100/50 dark:bg-white/5 border-none rounded-2xl px-12 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                        placeholder="New Password"
                                        value={password}
                                        onChange={(e) => setPasswordState(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full h-14 bg-gray-100/50 dark:bg-white/5 border-none rounded-2xl px-12 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">
                                {loading ? "Updating..." : "Reset & Login"}
                            </Button>
                        </form>
                    )}

                    {step === 4 && (
                        <form className="space-y-6" onSubmit={handleLoginPassword}>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    className="w-full h-14 bg-gray-100/50 dark:bg-white/5 border-none rounded-2xl px-12 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPasswordState(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">
                                    {loading ? "Signing in..." : "Login"}
                                </Button>

                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        disabled={loading}
                                        className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        ← Use a different email
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </CardContent>

                <div className="px-10 pb-8 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Secure Authentication with Reset Capability
                    </p>
                </div>
            </Card>
        </div>
    );
}
