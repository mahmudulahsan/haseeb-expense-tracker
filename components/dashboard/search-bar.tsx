"use client";

import { Search } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "use-debounce";

export function SearchBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();

    const [text, setText] = useState(searchParams.get("q")?.toString() || "");
    const [query] = useDebounce(text, 300);

    const activeTab = searchParams.get("tab") || "home";

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (query) {
            params.set("q", query);
        } else {
            params.delete("q");
        }

        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    }, [query, pathname, replace, searchParams]);

    if (activeTab === "statistic") return null;

    return (
        <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-gray-100/50 dark:bg-white/5 px-4 py-2 mr-2 border border-transparent focus-within:border-primary/20 transition-all">
            <Search className={`h-4 w-4 ${isPending ? "text-primary animate-pulse" : "text-gray-400"}`} />
            <input
                type="text"
                placeholder="Search..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 w-24 md:w-40 outline-none placeholder:text-gray-400"
            />
        </div>
    );
}
