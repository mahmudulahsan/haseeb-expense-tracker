import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: LucideIcon;
    color?: string;
}

export function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
    return (
        <Card className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "p-3 rounded-2xl flex items-center justify-center",
                        color || "bg-primary/10 text-primary"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {change && (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                            {change}
                        </span>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h4 className="text-2xl font-bold mt-1">{value}</h4>
                </div>
            </CardContent>
        </Card>
    );
}
