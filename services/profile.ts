import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

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

    return data;
}
