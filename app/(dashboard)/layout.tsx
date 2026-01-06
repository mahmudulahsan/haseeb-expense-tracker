import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getProfile } from "@/services/profile";

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
            <Header
                userEmail={user.email}
                profileName={profile?.display_name}
                profileCurrency={profile?.currency}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-10 pb-24">
                {children}
            </main>
        </div>
    );
}
