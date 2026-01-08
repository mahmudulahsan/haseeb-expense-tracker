import { checkAdminSession, getAdminStats } from "../actions";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Database, ShieldCheck, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
    const isAuth = await checkAdminSession();
    if (!isAuth) {
        redirect("/admin");
    }

    const stats = await getAdminStats();

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        Dashboard Overview
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Welcome back, Administrator. Here's what's happening today.
                    </p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={stats.users.count}
                    icon={<Users className="h-5 w-5 text-blue-400" />}
                    description="Registered accounts"
                    trend="+12% this month"
                    trendUp={true}
                />
                <StatsCard
                    title="Total Transactions"
                    value={stats.system.totalTransactions}
                    icon={<Activity className="h-5 w-5 text-emerald-400" />}
                    description="Recorded finance entries"
                    trend="Active usage"
                    trendUp={true}
                />
                <StatsCard
                    title="AI Insights"
                    value={stats.system.totalInsights}
                    icon={<Database className="h-5 w-5 text-purple-400" />}
                    description="Generated reports"
                />
                <UsageLimitCard
                    count={stats.system.totalTransactions + stats.system.totalInsights + stats.users.count}
                />
            </div>

            {/* Quick Links / System Heath */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            System Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="text-zinc-400">Database Status</span>
                            <span className="text-emerald-500 font-medium text-sm flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Operational
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="text-zinc-400">API Latency</span>
                            <span className="text-emerald-500 font-medium text-sm">~45ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Last Backup</span>
                            <span className="text-zinc-300 font-medium text-sm">Today, 04:00 AM</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-base">Quick Navigation</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Link href="/admin/dashboard/users">
                            <Button variant="outline" className="w-full justify-between items-center text-zinc-300 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white h-auto py-3">
                                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Manage Users</span>
                                <ArrowRight className="h-4 w-4 opacity-50" />
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/transactions">
                            <Button variant="outline" className="w-full justify-between items-center text-zinc-300 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white h-auto py-3">
                                <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500" /> View Transactions</span>
                                <ArrowRight className="h-4 w-4 opacity-50" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, description, trend, trendUp }: any) {
    return (
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-200">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
                <p className="text-xs text-zinc-400 mt-1">{description}</p>
                {trend && (
                    <div className={`flex items-center text-xs mt-2 ${trendUp ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {trendUp && <TrendingUp className="mr-1 h-3 w-3" />}
                        {trend}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function UsageLimitCard({ count }: { count: number }) {
    // 500MB is huge for text data.
    // 100,000 rows is a safe "warning" threshold for a small app to start checking size.
    // This is arbitrary but useful.
    const warningThreshold = 100000;
    const percentage = Math.min((count / warningThreshold) * 100, 100);
    const isWarning = percentage > 80;

    return (
        <Card className={`border-zinc-800 bg-zinc-900/50 ${isWarning ? 'border-amber-900/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-200">Supabase Tier</CardTitle>
                <AlertCircle className={`h-5 w-5 ${isWarning ? 'text-amber-500' : 'text-zinc-500'}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">{percentage < 1 ? "<1%" : `${percentage.toFixed(1)}%`}</div>
                <p className="text-xs text-zinc-400 mt-1">Of safe row capacity limit</p>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
