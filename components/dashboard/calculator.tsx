"use client";

import { useState } from "react";
import { Calculator as CalcIcon, X, RotateCcw, Delete } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Calculator() {
    const [display, setDisplay] = useState("0");
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

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
            setDisplay(String(result));
            setPrevValue(null);
            setOperator(null);
            setWaitingForOperand(false);
        }
    };

    const buttons = [
        { label: "AC", action: clearAll, className: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20" },
        { label: "DEL", action: deleteLast, icon: Delete, className: "bg-gray-100 dark:bg-white/5" },
        { label: "/", action: () => performOperation("/"), className: "bg-primary/10 text-primary font-black" },
        { label: "*", action: () => performOperation("*"), className: "bg-primary/10 text-primary font-black" },
        { label: "7", action: () => inputDigit("7") },
        { label: "8", action: () => inputDigit("8") },
        { label: "9", action: () => inputDigit("9") },
        { label: "-", action: () => performOperation("-"), className: "bg-primary/10 text-primary font-black" },
        { label: "4", action: () => inputDigit("4") },
        { label: "5", action: () => inputDigit("5") },
        { label: "6", action: () => inputDigit("6") },
        { label: "+", action: () => performOperation("+"), className: "bg-primary/10 text-primary font-black" },
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
            <DialogContent className="max-w-[320px] rounded-[2.5rem] p-6 border-none shadow-2xl bg-white/95 dark:bg-black/95 backdrop-blur-xl gap-4">
                <DialogHeader className="flex flex-row items-center gap-2 space-y-0">
                    <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CalcIcon className="h-4 w-4 text-primary" />
                    </div>
                    <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Calculator</DialogTitle>
                </DialogHeader>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-right overflow-hidden shadow-inner border border-black/5 dark:border-white/5 mt-2">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-4 opacity-50">
                        {prevValue !== null ? `${prevValue} ${operator}` : ""}
                    </div>
                    <div className="text-3xl font-black tracking-tight truncate">
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
                                "h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95",
                                btn.className || "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {btn.icon ? <btn.icon className="h-4 w-4" /> : btn.label}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

