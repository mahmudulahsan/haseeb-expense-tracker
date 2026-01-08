"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Activity,
    LogOut,
    ShieldCheck,
    Settings,
    Database
} from "lucide-react";
import { adminLogout } from "@/app/admin/actions";

export function AdminSidebar() {
    const pathname = usePathname();

    const links = [
        {
            href: "/admin/dashboard",
            label: "Overview",
            icon: LayoutDashboard,
            exact: true
        },
        {
            href: "/admin/dashboard/users",
            label: "User Directory",
            icon: Users,
            exact: false
        },
        {
            href: "/admin/dashboard/transactions",
            label: "Transactions",
            icon: Activity,
            exact: false
        },
        {
            href: "/admin/dashboard/system",
            label: "System Health",
            icon: Database,
            exact: false
        }
    ];

    return (
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full fixed left-0 top-0">
            <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
                <span className="font-bold text-xl text-white tracking-tight">AdminPortal</span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const isActive = link.exact
                        ? pathname === link.href
                        : pathname?.startsWith(link.href);

                    return (
                        <Link key={link.href} href={link.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 px-3 py-6 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 hover:text-emerald-400"
                                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                )}
                            >
                                <link.icon className={cn("h-5 w-5", isActive ? "text-emerald-500" : "text-zinc-500")} />
                                <span className="font-medium">{link.label}</span>
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <form action={adminLogout}>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/30 transition-all group"
                    >
                        <LogOut className="h-4 w-4 group-hover:text-red-500 transition-colors" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    );
}
