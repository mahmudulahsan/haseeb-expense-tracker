"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAccount } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteAccountButton({ id, name }: { id: string, name: string }) {
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        const result = await deleteAccount(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Account deleted successfully");
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-full"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                onConfirm={handleDelete}
                title="Delete Account"
                description={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
            />
        </>
    );
}
