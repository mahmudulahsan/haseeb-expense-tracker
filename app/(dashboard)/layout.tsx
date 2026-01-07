import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getProfile } from "@/services/profile";

import { getCategories } from "@/services/expenses";

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
    const categories = await getCategories().catch(() => []);

    return (
        <div className="flex min-h-screen flex-col bg-[#F9F7F2] dark:bg-[#0A0A0A] transition-colors duration-300">
            <Header
                userEmail={user.email}
                profileName={profile?.display_name}
                profileCurrency={profile?.currency}
                categories={categories}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-10 pb-16">
                {children}
            </main>

            <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 pb-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 hover:text-primary transition-colors duration-500">
                    Developed by <a href="https://ahsan-xp.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:underline">Mahmudul Ahsan</a>
                </p>
            </footer>
        </div>
    );
}
