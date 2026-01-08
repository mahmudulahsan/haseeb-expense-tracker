import { checkAdminSession } from "@/app/admin/actions";
import { getAdminTransactions } from "../actions";
import { AdminTransactionList } from "../admin-transaction-list";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";

export default async function AdminTransactionsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const isAuth = await checkAdminSession();
    if (!isAuth) {
        redirect("/admin");
    }

    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const { transactions, totalPages, totalCount } = await getAdminTransactions(page, 15);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Activity className="h-8 w-8 text-emerald-500" />
                        Global Transactions
                    </h2>
                    <p className="text-zinc-400 mt-2">
                        Real-time feed of all financial activities across the system.
                    </p>
                </div>
            </div>

            <AdminTransactionList
                transactions={transactions || []}
                currentPage={page}
                totalPages={totalPages || 1}
                totalCount={totalCount || 0}
            />
        </div>
    );
}
