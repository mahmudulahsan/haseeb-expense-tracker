"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTransaction } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({ id }: { id: string }) {
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        const result = await deleteTransaction(id);
        if (result.error) {
            alert(result.error);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-full"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                onConfirm={handleDelete}
                title="Delete Transaction"
                description="Are you sure you want to delete this transaction? The account balance will be adjusted accordingly."
            />
        </>
    );
}
