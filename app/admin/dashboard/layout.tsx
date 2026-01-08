import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-950 flex">
            <AdminSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
