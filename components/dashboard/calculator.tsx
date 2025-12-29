"use client";

import { useState, useEffect } from "react";
import { Calculator as CalcIcon, X, RotateCcw, Delete, History, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalculationHistory {
    expression: string;
    result: string;
    timestamp: number;
}

export function Calculator() {
    const [display, setDisplay] = useState("0");
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [history, setHistory] = useState<CalculationHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem("calculator-history");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to load calculator history:", e);
            }
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem("calculator-history", JSON.stringify(history));
        }
    }, [history]);

    const addToHistory = (expression: string, result: string) => {
        const newEntry: CalculationHistory = {
            expression,
            result,
            timestamp: Date.now()
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 entries
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("calculator-history");
    };

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === "0" ? digit : display + digit);
        }
    };

    const inputDot = () => {
        if (waitingForOperand) {
            setDisplay(".");
            setWaitingForOperand(false);
        } else if (display.indexOf(".") === -1) {
            setDisplay(display + ".");
        }
    };

    const clearAll = () => {
        setDisplay("0");
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const deleteLast = () => {
        setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (prevValue === null) {
            setPrevValue(inputValue);
        } else if (operator) {
            const currentValue = prevValue || 0;
            const newValue = calculate(currentValue, inputValue, operator);
            setPrevValue(newValue);
            setDisplay(String(newValue));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };

    const calculate = (prev: number, next: number, op: string) => {
        switch (op) {
            case "+": return prev + next;
            case "-": return prev - next;
            case "*": return prev * next;
            case "/": return prev / next;
            default: return next;
        }
    };

    const handleEquals = () => {
        const inputValue = parseFloat(display);
        if (operator && prevValue !== null) {
            const result = calculate(prevValue, inputValue, operator);
            const expression = `${prevValue} ${operator} ${inputValue}`;
            setDisplay(String(result));
            addToHistory(expression, String(result));
            setPrevValue(null);
            setOperator(null);
            setWaitingForOperand(false);
        }
    };

    const useHistoryValue = (value: string) => {
        setDisplay(value);
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const buttons = [
        { label: "AC", action: clearAll, className: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:hover:bg-orange-500/30" },
        { label: "DEL", action: deleteLast, icon: Delete, className: "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15" },
        { label: "/", action: () => performOperation("/"), className: "bg-primary/10 text-primary font-black dark:bg-primary/20 dark:hover:bg-primary/30" },
        { label: "*", action: () => performOperation("*"), className: "bg-primary/10 text-primary font-black dark:bg-primary/20 dark:hover:bg-primary/30" },
        { label: "7", action: () => inputDigit("7") },
        { label: "8", action: () => inputDigit("8") },
        { label: "9", action: () => inputDigit("9") },
        { label: "-", action: () => performOperation("-"), className: "bg-primary/10 text-primary font-black dark:bg-primary/20 dark:hover:bg-primary/30" },
        { label: "4", action: () => inputDigit("4") },
        { label: "5", action: () => inputDigit("5") },
        { label: "6", action: () => inputDigit("6") },
        { label: "+", action: () => performOperation("+"), className: "bg-primary/10 text-primary font-black dark:bg-primary/20 dark:hover:bg-primary/30" },
        { label: "1", action: () => inputDigit("1") },
        { label: "2", action: () => inputDigit("2") },
        { label: "3", action: () => inputDigit("3") },
        { label: "=", action: handleEquals, className: "row-span-2 bg-primary text-white hover:bg-primary/90 h-full font-black text-xl" },
        { label: "0", action: () => inputDigit("0"), className: "col-span-2" },
        { label: ".", action: inputDot },
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
                    <CalcIcon className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[320px] rounded-[2.5rem] p-6 border-none shadow-2xl bg-white/95 dark:bg-zinc-900 backdrop-blur-xl gap-4">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-10">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                            <CalcIcon className="h-4 w-4 text-primary" />
                        </div>
                        <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Calculator</DialogTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHistory(!showHistory)}
                        className={cn(
                            "h-8 w-8 rounded-xl transition-colors",
                            showHistory ? "bg-primary/20 text-primary" : "hover:bg-primary/10"
                        )}
                    >
                        <History className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                {showHistory ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">History</h3>
                            {history.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearHistory}
                                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-xs opacity-50">
                                    No calculations yet
                                </div>
                            ) : (
                                history.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            useHistoryValue(item.result);
                                            setShowHistory(false);
                                        }}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-left group"
                                    >
                                        <div className="text-[10px] font-bold text-muted-foreground dark:text-gray-400 uppercase tracking-wider truncate">
                                            {item.expression}
                                        </div>
                                        <div className="text-lg font-black text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                            = {item.result}
                                        </div>
                                        <div className="text-[8px] text-muted-foreground/50 mt-1">
                                            {new Date(item.timestamp).toLocaleTimeString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50 dark:bg-white/10 rounded-2xl p-4 text-right overflow-hidden shadow-inner border border-black/5 dark:border-white/10 mt-2">
                            <div className="text-[10px] font-bold text-muted-foreground dark:text-gray-400 uppercase tracking-widest h-4 opacity-70">
                                {prevValue !== null ? `${prevValue} ${operator}` : ""}
                            </div>
                            <div className="text-3xl font-black tracking-tight truncate text-gray-900 dark:text-white">
                                {display}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {buttons.map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        btn.action();
                                    }}
                                    className={cn(
                                        "h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 text-gray-900 dark:text-white",
                                        btn.className || "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15"
                                    )}
                                >
                                    {btn.icon ? <btn.icon className="h-4 w-4" /> : btn.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

