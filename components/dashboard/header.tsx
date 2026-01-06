"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Navbar } from "@/components/dashboard/navbar";
import { SearchBar } from "@/components/dashboard/search-bar";
import { Calculator } from "@/components/dashboard/calculator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileButton } from "@/components/dashboard/profile-button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
    userEmail: string;
    profileName?: string;
    profileCurrency?: string;
}

export function Header({ userEmail, profileName, profileCurrency }: HeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <header className="sticky top-2 sm:top-6 z-50 mx-auto w-[98%] sm:w-[95%] max-w-7xl px-2 sm:px-4 mb-4">
            <nav className={cn(
                "flex flex-col rounded-2xl sm:rounded-[2.5rem] bg-white/90 dark:bg-black/90 shadow-sm backdrop-blur-xl border border-white/20 transition-all duration-300 overflow-hidden",
                isExpanded ? "p-4 gap-4" : "px-1.5 sm:px-4 py-2 sm:py-3"
            )}>
                {/* Top Row: Logo, Navbar (Desktop), and Toggle */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1 sm:gap-4 pl-0.5 sm:pl-4">
                        <Link href="/" className="flex items-center" onClick={() => setIsExpanded(false)}>
                            <Logo showText size="md" className="scale-90 sm:scale-100 origin-left" />
                        </Link>
                        <div className="hidden md:block">
                            <Navbar />
                        </div>
                    </div>

                    {/* Right Side Actions (Desktop) */}
                    <div className="hidden md:flex items-center justify-end gap-0.5 sm:gap-3 ml-auto pr-1 sm:pr-4">
                        <SearchBar />
                        <Calculator />
                        <ThemeToggle />
                        <div className="shrink-0 scale-[0.85] sm:scale-100 origin-right ml-0.5 sm:ml-0">
                            <ProfileButton initialName={profileName} initialCurrency={profileCurrency} email={userEmail} />
                        </div>
                    </div>

                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex md:hidden items-center justify-center h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/10 text-primary transition-all active:scale-95 ml-auto"
                    >
                        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Expanded Content (Mobile Only) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex flex-col gap-4 md:hidden"
                        >
                            <div className="h-px bg-gray-100 dark:bg-white/10 w-full" />

                            <div className="flex flex-col gap-4 px-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Navigation</span>
                                    <Navbar />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Actions</span>
                                    <div className="flex items-center gap-2">
                                        <SearchBar />
                                        <Calculator />
                                        <ThemeToggle />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-bold">Account</span>
                                    <ProfileButton initialName={profileName} initialCurrency={profileCurrency} email={userEmail} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}
