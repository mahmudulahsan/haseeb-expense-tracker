"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceTransaction } from "@/app/actions/finance";
import { cn } from "@/lib/utils";
import { formatLocalDate } from "@/lib/date-utils";
import { toast } from "sonner";

export function VoiceTransactionButton() {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "en-US";

                recognitionRef.current.onresult = async (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setIsListening(false);
                    handleVoiceCommand(transcript);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error);
                    setIsListening(false);
                    setStatus("Error: " + event.error);
                    setTimeout(() => setStatus(null), 3000);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setStatus("Listening...");
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleVoiceCommand = async (text: string) => {
        setIsProcessing(true);
        setStatus("Processing...");
        try {
            const result = await voiceTransaction(text, formatLocalDate());
            if ("success" in result && result.success) {
                setStatus("Success!");
                toast.success("Voice transaction processed successfully!");
                setTimeout(() => setStatus(null), 2000);
            } else {
                const errorMsg = "error" in result ? result.error : "Failed";
                setStatus("Error: " + errorMsg);
                setTimeout(() => setStatus(null), 4000);
                toast.error(errorMsg || "Failed to process transaction.");
            }
        } catch (error) {
            console.error("Error processing voice command:", error);
            setStatus("Error occurred");
            setTimeout(() => setStatus(null), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {status && (
                <span className="text-[10px] font-medium text-muted-foreground animate-in fade-in slide-in-from-right-2">
                    {status}
                </span>
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                disabled={isProcessing}
                className={cn(
                    "rounded-full transition-all duration-300 h-9 w-9",
                    isListening ? "bg-red-500/10 text-red-500 animate-pulse" : "hover:bg-primary/10 text-muted-foreground"
                )}
                title="Voice Transaction"
            >
                {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Mic className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
