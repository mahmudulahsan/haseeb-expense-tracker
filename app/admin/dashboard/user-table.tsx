"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { UserTransactionsDialog } from "./user-transactions-dialog";

export function UserTable({ users }: { users: any[] }) {
    return (
        <Card className="md:col-span-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col h-[600px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-zinc-400" />
                    User Directory
                </CardTitle>
                <CardDescription>
                    Complete list of {users.length} registered users and their activity.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <div className="relative w-full h-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="bg-zinc-900 sticky top-0 z-10 [&_tr]:border-b [&_tr]:border-zinc-800 shadow-sm">
                            <tr>
                                <th className="h-10 px-4 align-middle font-medium text-zinc-400">User</th>
                                <th className="h-10 px-4 align-middle font-medium text-zinc-400">Display Name</th>
                                <th className="h-10 px-4 align-middle font-medium text-zinc-400 text-center">Transactions</th>
                                <th className="h-10 px-4 align-middle font-medium text-zinc-400 text-right">Joined</th>
                                <th className="h-10 px-4 align-middle font-medium text-zinc-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-zinc-500">No users found</td>
                                </tr>
                            ) : (
                                users.map((user: any) => (
                                    <tr key={user.id} className="transition-colors hover:bg-zinc-800/50">
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-200">{user.email}</span>
                                                <span className="text-xs text-zinc-500 font-mono" title={user.id}>{user.id.slice(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-300">{user.display_name || "N/A"}</td>
                                        <td className="p-4 align-middle text-zinc-300 text-center font-mono">{user.transactionCount}</td>
                                        <td className="p-4 align-middle text-zinc-400 text-right">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : "N/A"}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <UserTransactionsDialog
                                                userId={user.id}
                                                userEmail={user.email}
                                                transactionCount={user.transactionCount}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
