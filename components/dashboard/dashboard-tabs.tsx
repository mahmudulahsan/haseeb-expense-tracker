"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HomeContent } from "./home-content";
import { StatisticsContent } from "./statistics-content";
import { ZakatContent } from "./zakat-content";
import { LiabilitiesContent } from "./liabilities-content";

interface DashboardTabsProps {
    expenses: any[];
    accounts: any[];
    categories: any[];
    greeting: string;
    currencySymbol: string;
    totalIncome: number;
    totalSpent: number;
    zakatTarget: number;
    liabilities?: any[];
    calculateLiabilities?: boolean;
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
            {activeTab === "home" && <HomeContent {...props} />}
            {activeTab === "statistic" && (
                <StatisticsContent
                    expenses={props.expenses}
                    categories={props.categories}
                    currencySymbol={props.currencySymbol}
                />
            )}
            {activeTab === "zakat" && (
                <ZakatContent
                    currencySymbol={props.currencySymbol}
                    zakatTarget={props.zakatTarget}
                    expenses={props.expenses}
                    categories={props.categories}
                />
            )}
            {activeTab === "liabilities" && (
                <LiabilitiesContent
                    currencySymbol={props.currencySymbol}
                />
            )}
        </div>
    );
}
