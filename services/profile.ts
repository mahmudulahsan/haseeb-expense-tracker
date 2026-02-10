import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { decrypt, encrypt, decryptNumber } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function getProfile() {
    const session = await getSession();
    if (!session) return null;

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    if (data) {
        if (data.zakat_target != null) {
            data.zakat_target = decryptNumber(data.zakat_target);
        }

        if (data.zakat_breakdown) {
            let breakdown = data.zakat_breakdown;
            try {
                if (typeof breakdown === 'object' && 'encrypted' in breakdown) {
                    const decryptedValue = decrypt(breakdown.encrypted);
                    data.zakat_breakdown = JSON.parse(decryptedValue);
                } else if (typeof breakdown === 'string') {
                    const decryptedValue = decrypt(breakdown);
                    data.zakat_breakdown = JSON.parse(decryptedValue);
                }
            } catch (e) {
                console.error("Failed to decrypt zakat_breakdown in profile:", e);
                data.zakat_breakdown = {};
            }
        }
    }

    return data;
}
