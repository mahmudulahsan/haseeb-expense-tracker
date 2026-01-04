"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BarChart3,
    HandHeart,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { icon: LayoutDashboard, label: "Home", tab: "home" },
    { icon: BarChart3, label: "Statistic", tab: "statistic" },
    { icon: HandHeart, label: "Zakat", tab: "zakat" },
];

export function Navbar() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "home";

    const handleTabChange = (tab: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.toString());
        // Force update for components using useSearchParams
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-2xl bg-gray-100/50 dark:bg-white/5 p-1 relative z-20">
            {navItems.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                    <button
                        key={item.label}
                        onClick={() => handleTabChange(item.tab)}
                        className={cn(
                            "flex items-center gap-1.5 sm:gap-2 rounded-xl px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold sm:font-medium transition-all cursor-pointer relative z-30",
                            isActive
                                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                                : "text-gray-500 hover:text-black dark:hover:text-white"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline-block">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
