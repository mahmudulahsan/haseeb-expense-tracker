"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HomeContent } from "./home-content";
import { StatisticsContent } from "./statistics-content";

interface DashboardTabsProps {
    expenses: any[];
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol: string;
    totalIncome: number;
    totalSpent: number;
}

export function DashboardTabs(props: DashboardTabsProps) {
    const searchParams = useSearchParams();
    const [_, setRender] = useState(0);

    useEffect(() => {
        const handlePopState = () => setRender(r => r + 1);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const activeTab = searchParams.get("tab") || "home";

    return (
        <div className="w-full">
            {activeTab === "home" ? (
                <HomeContent {...props} />
            ) : (
                <StatisticsContent
                    expenses={props.expenses}
                    categories={props.categories}
                    currencySymbol={props.currencySymbol}
                />
            )}
        </div>
    );
}
