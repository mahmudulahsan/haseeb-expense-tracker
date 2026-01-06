import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

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
            // If it's a string containing ':', it's likely encrypted
            if (typeof data.zakat_target === 'string' && data.zakat_target.includes(':')) {
                data.zakat_target = Number(decrypt(data.zakat_target, session.vaultKey));
            } else {
                // It might be a number or a plain string (old data)
                data.zakat_target = Number(data.zakat_target);
            }
        }

        if (data.zakat_breakdown && typeof data.zakat_breakdown === 'object' && 'encrypted' in data.zakat_breakdown) {
            try {
                const decryptedValue = decrypt(data.zakat_breakdown.encrypted, session.vaultKey);
                data.zakat_breakdown = JSON.parse(decryptedValue);
            } catch (e) {
                console.error("Failed to decrypt zakat_breakdown in profile:", e);
                data.zakat_breakdown = {};
            }
        }
    }

    return data;
}
