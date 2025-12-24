import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, code, isForgot } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Verify OTP
        const { data, error: dbError } = await supabase
            .from("auth_otps")
            .select("*")
            .eq("email", email)
            .eq("code", code)
            .single();

        if (dbError || !data) {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
            return NextResponse.json({ error: "Code has expired" }, { status: 401 });
        }

        // 2. Get or Create User
        let { data: user, error: userError } = await supabase
            .from("profiles")
            .select("id, email, password_hash")
            .eq("email", email)
            .single();

        if (userError || !user) {
            // Create user profile
            const { data: newUser, error: createError } = await supabase
                .from("profiles")
                .insert({ email })
                .select("id, email, password_hash")
                .single();

            if (createError) {
                console.error("Error creating user:", createError);
                return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
            }
            user = newUser;
        }

        // 3. Delete used OTP
        await supabase.from("auth_otps").delete().eq("email", email);

        // 4. If password is not set OR this is a forgot-password flow, tell client to show "Set Password" screen
        if (!user.password_hash || isForgot) {
            return NextResponse.json({ success: true, needsPassword: true });
        }

        // If for some reason they have a password but still used OTP (shouldn't happen), log them in
        await login({ id: user.id, email: user.email });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Internal error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
