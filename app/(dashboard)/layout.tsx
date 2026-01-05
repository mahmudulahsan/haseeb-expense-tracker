import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Navbar } from "@/components/dashboard/navbar";
import {
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/services/profile";
import { ProfileButton } from "@/components/dashboard/profile-button";
import { Calculator } from "@/components/dashboard/calculator";
import { SearchBar } from "@/components/dashboard/search-bar";
import { Logo } from "@/components/shared/logo";


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
            <header className="sticky top-2 sm:top-6 z-50 mx-auto w-[98%] sm:w-[95%] max-w-7xl px-2 sm:px-4 mb-4">
                <nav className="flex items-center rounded-2xl sm:rounded-[2.5rem] bg-white/90 dark:bg-black/90 px-1.5 sm:px-4 py-2 sm:py-3 shadow-sm backdrop-blur-xl border border-white/20">
                    <div className="flex items-center gap-1 sm:gap-4 pl-0.5 sm:pl-4">
                        <Link href="/" className="flex items-center">
                            <Logo showText size="md" className="scale-90 sm:scale-100 origin-left" />
                        </Link>
                        <Navbar />
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center justify-end gap-0.5 sm:gap-3 ml-auto pr-1 sm:pr-4">
                        <SearchBar />
                        <div className="hidden min-[350px]:block">
                            <Calculator />
                        </div>
                        <ThemeToggle />
                        <div className="shrink-0 scale-[0.85] sm:scale-100 origin-right ml-0.5 sm:ml-0">
                            <ProfileButton initialName={profile?.display_name} initialCurrency={profile?.currency} email={user.email} />
                        </div>
                    </div>
                </nav>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-28 sm:pt-10 pb-24">
                {children}
            </main>
        </div>
    );
}
