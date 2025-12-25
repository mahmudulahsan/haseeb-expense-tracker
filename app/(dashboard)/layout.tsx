import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Navbar } from "@/components/dashboard/navbar";
import {
    PiggyBank,
    Search,
    Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/services/profile";
import { ProfileButton } from "@/components/dashboard/profile-button";


export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const { user } = session;
    const profile = await getProfile();

    return (
        <div className="flex min-h-screen flex-col bg-[#F9F7F2] dark:bg-[#0A0A0A] transition-colors duration-300">
            {/* Premium Floating Header */}
            <header className="sticky top-6 z-50 mx-auto w-[95%] max-w-7xl px-4 mb-4">
                <nav className="flex items-center justify-between rounded-[2.5rem] bg-white/80 dark:bg-black/80 px-4 py-3 shadow-sm backdrop-blur-xl border border-white/20">
                    <div className="flex items-center gap-2 pl-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
                            <PiggyBank className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Haseeb</span>
                    </div>

                    {/* Center Nav Items */}
                    <Navbar />

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3 pr-2">
                        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-gray-100/50 dark:bg-white/5 px-4 py-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none text-sm focus:ring-0 w-24 outline-none"
                            />
                        </div>

                        <ThemeToggle />
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <ProfileButton initialName={profile?.display_name} initialCurrency={profile?.currency} />
                    </div>
                </nav>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-8 pt-10 pb-24">
                {children}
            </main>
        </div>
    );
}
