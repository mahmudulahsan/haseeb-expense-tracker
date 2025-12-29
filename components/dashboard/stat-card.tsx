"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: LucideIcon;
    color?: string;
}

export function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card className="overflow-hidden border-none shadow-sm dark:bg-white/5 h-full">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            whileHover={{ rotate: 15 }}
                            className={cn(
                                "p-3 rounded-2xl flex items-center justify-center",
                                color || "bg-primary/10 text-primary"
                            )}
                        >
                            <Icon className="h-6 w-6" />
                        </motion.div>
                        {change && (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                {change}
                            </span>
                        )}
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <motion.h4
                            key={value}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold mt-1"
                        >
                            {value}
                        </motion.h4>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
