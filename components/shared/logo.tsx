import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconClassName?: string;
    showText?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, iconClassName, showText = false, size = "md" }: LogoProps) {
    const sizes = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
    };

    const iconSizes = {
        sm: "h-5 w-5",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-10 w-10",
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className={cn(
                    "flex items-center justify-center rounded-[1rem] sm:rounded-2xl bg-black dark:bg-white text-white dark:text-black shrink-0 shadow-lg transition-all duration-300 hover:rotate-2 hover:scale-105 active:scale-95 group",
                    sizes[size],
                    iconClassName
                )}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(iconSizes[size], "transition-transform duration-500 group-hover:rotate-12")}
                >
                    {/* Unique H Design: Two thick rounded pillars */}
                    <path
                        d="M7 5V19M17 5V19"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {/* The Crossbar - partially hidden by coin */}
                    <path
                        d="M7 12H17"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="opacity-20"
                    />

                    {/* The Coin: Placed centrally and cleanly */}
                    <circle
                        cx="12"
                        cy="12"
                        r="4.5"
                        fill="#f97316"
                        stroke="currentColor"
                        strokeWidth="1.2"
                    />
                </svg>
            </div>
            {showText && (
                <span className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">
                    Haseeb
                </span>
            )}
        </div>
    );
}
