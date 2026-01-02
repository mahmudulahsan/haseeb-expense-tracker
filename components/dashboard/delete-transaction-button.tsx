"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTransaction } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
            <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(true)}
                    className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/10 border border-red-500/20"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </motion.div>
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
