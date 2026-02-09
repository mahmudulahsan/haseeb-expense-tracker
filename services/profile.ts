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
            try {
                // Try to parse as multi-year JSON
                const targets = JSON.parse(data.zakat_target);
                if (typeof targets === 'object' && targets !== null) {
                    const currentYear = new Date().getFullYear().toString();
                    data.zakat_target = decryptNumber(targets[currentYear] || 0);
                } else {
                    data.zakat_target = decryptNumber(data.zakat_target);
                }
            } catch (e) {
                // Fallback to legacy single value
                data.zakat_target = decryptNumber(data.zakat_target);
            }
        }

        if (data.zakat_breakdown) {
            let breakdown = data.zakat_breakdown;
            try {
                let fullBreakdown: any = {};
                if (typeof breakdown === 'object' && 'encrypted' in breakdown) {
                    fullBreakdown = JSON.parse(decrypt(breakdown.encrypted));
                } else if (typeof breakdown === 'string') {
                    fullBreakdown = JSON.parse(decrypt(breakdown));
                }

                // If it's the new multi-year format, extract the current year
                if (fullBreakdown && typeof fullBreakdown === 'object') {
                    const currentYear = new Date().getFullYear().toString();
                    if (fullBreakdown[currentYear]) {
                        data.zakat_breakdown = fullBreakdown[currentYear];
                    } else if (fullBreakdown.cashInHand !== undefined) {
                        // Legacy format
                        data.zakat_breakdown = fullBreakdown;
                    } else {
                        data.zakat_breakdown = {};
                    }
                }
            } catch (e) {
                console.error("Failed to decrypt zakat_breakdown in profile:", e);
                data.zakat_breakdown = {};
            }
        }
    }

    return data;
}
