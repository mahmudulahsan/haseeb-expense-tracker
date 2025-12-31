import { getCategories } from "@/services/expenses";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewExpensePage() {
    const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const user = authUser || { email: "guest@example.com", id: "mock-id" };

    /* 
    if (!user) {
        redirect("/login");
    }
    */

    const categories = await getCategories();

    return (
        <div className="mx-auto max-w-2xl p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold">Add New Expense</h1>
                <p className="text-gray-600">Enter the details of your latest spending.</p>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <ExpenseForm categories={categories} />
            </div>
        </div>
    );
}
