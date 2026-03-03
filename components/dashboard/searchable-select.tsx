"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X, Plus, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchableSelectProps {
    options: { id: string; name: string; user_id?: string | null }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    emptyMessage?: string;
    onCreate?: (value: string) => void;
    createLabel?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    className,
    emptyMessage = "No results found.",
    onCreate,
    createLabel = "Create new",
    onDelete,
    onEdit,
    disabled = false
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    const selectedOption = options.find((opt) => opt.id === value);

    const filteredOptions = options.filter((opt) =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const exactMatch = options.find(
        (opt) => opt.name.toLowerCase() === search.trim().toLowerCase()
    );

    // Close when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset search when opening/closing
    React.useEffect(() => {
        if (!open) setSearch("");
    }, [open]);

    // Handle delete with confirmation or direct
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onDelete) {
            setDeletingId(id);
            await onDelete(id);
            setDeletingId(null);
        }
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-2xl border-none bg-gray-100 dark:bg-white/5 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary outline-none font-medium",
                    open && "ring-2 ring-primary bg-white dark:bg-white/10",
                    disabled && "opacity-60 cursor-not-allowed grayscale-[0.5]"
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", open && "rotate-180")} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="absolute z-[100] w-full mt-3 bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
                    >
                        <div className="p-2 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                            <Search className="h-4 w-4 opacity-40 ml-2" />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-sm py-2 placeholder:text-muted-foreground"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && search.trim() && !exactMatch && onCreate) {
                                        e.preventDefault();
                                        onCreate(search.trim());
                                        setOpen(false);
                                    }
                                }}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                                >
                                    <X className="h-3 w-3 opacity-40" />
                                </button>
                            )}
                        </div>

                        <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                            {/* Create new option */}
                            {onCreate && search.trim() && !exactMatch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onCreate(search.trim());
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm transition-colors text-left bg-primary/5 text-primary hover:bg-primary/10 border border-dashed border-primary/20 mb-1"
                                >
                                    <div className="h-5 w-5 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                        <Plus className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate font-bold">
                                        {createLabel} "{search.trim()}"
                                    </span>
                                </button>
                            )}

                            {filteredOptions.length === 0 && (!onCreate || !search.trim()) ? (
                                <div className="py-6 text-center text-xs text-muted-foreground italic">
                                    {emptyMessage}
                                </div>
                            ) : (
                                filteredOptions.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className={cn(
                                            "group/item flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors text-left cursor-pointer",
                                            value === opt.id
                                                ? "bg-primary/10 text-primary font-bold"
                                                : "hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                        onClick={() => {
                                            onValueChange(opt.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="truncate flex-1">{opt.name}</span>
                                        <div className="flex items-center gap-1">
                                            {onEdit && opt.user_id && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(opt.id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all hover:scale-110"
                                                    title="Edit category"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            {onDelete && opt.user_id && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDelete(e, opt.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all hover:scale-110"
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            {value === opt.id && <Check className="h-4 w-4" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
