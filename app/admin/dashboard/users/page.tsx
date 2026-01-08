import { checkAdminSession, getAdminStats } from "@/app/admin/actions";
import { UserTable } from "../user-table";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
    const isAuth = await checkAdminSession();
    if (!isAuth) {
        redirect("/admin");
    }

    const stats = await getAdminStats();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Users className="h-8 w-8 text-emerald-500" />
                        User Directory
                    </h2>
                    <p className="text-zinc-400 mt-2">
                        Manage registered users, view profiles, and audit user-specific activities.
                    </p>
                </div>
            </div>

            <UserTable users={stats.users.all} />
        </div>
    );
}
