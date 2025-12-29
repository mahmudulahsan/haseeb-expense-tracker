import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Navbar } from "@/components/dashboard/navbar";
import {
    PiggyBank,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/services/profile";
import { ProfileButton } from "@/components/dashboard/profile-button";
import { Calculator } from "@/components/dashboard/calculator";
import { SearchBar } from "@/components/dashboard/search-bar";


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
                <nav className="flex items-center rounded-[2.5rem] bg-white/80 dark:bg-black/80 px-2 sm:px-4 py-2 sm:py-3 shadow-sm backdrop-blur-xl border border-white/20">
                    <div className="flex-1 flex items-center gap-4 pl-2 sm:pl-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-primary text-white shrink-0">
                                <PiggyBank className="h-5 w-5 sm:h-6 w-6" />
                            </div>
                            <span className="text-lg sm:text-xl font-bold tracking-tight hidden min-[400px]:block">Haseeb</span>
                        </div>
                        <Navbar />
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex-1 flex items-center justify-end gap-1 sm:gap-3 pr-1 sm:pr-2">
                        <SearchBar />
                        <Calculator />
                        <ThemeToggle />
                        <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                            <ProfileButton initialName={profile?.display_name} initialCurrency={profile?.currency} />
                        </div>
                    </div>
                </nav>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-8 pt-10 pb-24">
                {children}
            </main>
        </div>
    );
}
