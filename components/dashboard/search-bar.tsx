"use client";

import { Search } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "use-debounce";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SearchBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    const [text, setText] = useState(searchParams.get("q")?.toString() || "");
    const [query] = useDebounce(text, 300);

    const activeTab = searchParams.get("tab") || "home";

    useEffect(() => {
        const currentQ = searchParams.get("q") || "";
        if (query === currentQ) return;

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
        <>
            {/* Desktop Version */}
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

            {/* Mobile Version */}
            <div className="lg:hidden flex items-center">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
                            <Search className={`h-5 w-5 ${isPending ? "text-primary animate-pulse" : "text-gray-400"}`} />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95%] sm:max-w-[425px] rounded-[2.5rem] p-6 border-none shadow-2xl bg-white/95 dark:bg-black/95 backdrop-blur-xl gap-4">
                        <DialogHeader>
                            <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Search Transactions</DialogTitle>
                        </DialogHeader>
                        <div className="relative mt-2">
                            <Search className={isPending ? "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" : "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Type to search..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full h-14 bg-gray-50 dark:bg-white/5 border-none rounded-[1.25rem] pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-medium transition-all"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
