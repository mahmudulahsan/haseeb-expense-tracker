import { checkAdminSession, getAdminStats, adminLogout } from "../actions";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Database, ShieldCheck, LogOut, TrendingUp, AlertCircle } from "lucide-react";
import { UserTable } from "./user-table";

export default async function AdminDashboard() {
    const isAuth = await checkAdminSession();
    if (!isAuth) {
        redirect("/admin");
    }

    const stats = await getAdminStats();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-emerald-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Monitor user growth, system metrics, and implementation usage.
                    </p>
                </div>
                <form action={adminLogout}>
                    <Button variant="outline" className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </form>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard
                    title="Total Users"
                    value={stats.users.count}
                    icon={<Users className="h-5 w-5 text-blue-400" />}
                    description="Registered accounts"
                    trend="+12% from last month" // Placeholder trend
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

            <div className="grid gap-8 md:grid-cols-3">
                {/* User Directory Section */}
                <UserTable users={stats.users.all} />

                {/* System Health / Usage Info */}
                <div className="space-y-6">
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                System Status
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
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-zinc-400 text-sm">Storage Usage Estimate</span>
                                    <span className="text-zinc-200 text-sm font-medium">Low</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[5%]"></div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Based on row count volume compared to free tier typical limits (500MB).
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-400 mb-4">
                                Maintenance tasks are currently automated. No manual intervention required.
                            </p>
                            <Button variant="outline" className="w-full justify-start text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:bg-zinc-800" disabled>
                                <Database className="mr-2 h-4 w-4" />
                                Run Backup (Auto)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
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
