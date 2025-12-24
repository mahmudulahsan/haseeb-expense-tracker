import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
    try {
        const { email, allowForgot } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Check if user has a password set
        const { data: profile } = await supabase
            .from("profiles")
            .select("password_hash")
            .eq("email", email)
            .single();

        if (profile?.password_hash && !allowForgot) {
            // Signal that password is required
            return NextResponse.json({ passwordRequired: true });
        }

        // 2. Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 2. Clear old OTPs for this email and save new one
        await supabase.from("auth_otps").delete().eq("email", email);

        const { error: dbError } = await supabase
            .from("auth_otps")
            .insert({
                email,
                code,
                expires_at: expiresAt.toISOString(),
            });

        if (dbError) {
            console.error("DB Error:", dbError);
            return NextResponse.json({ error: "Failed to store OTP" }, { status: 500 });
        }

        // 3. Send via Resend
        try {
            await resend.emails.send({
                from: "Haseeb <onboarding@resend.dev>",
                to: email,
                subject: "Your Login Code - Haseeb",
                html: `
                    <div style="font-family: sans-serif; padding: 40px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="background: #FF5722; width: 60px; height: 60px; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: auto; color: white; font-size: 30px;">🐷</div>
                            <h2 style="margin-top: 20px; color: #111;">Welcome to Haseeb</h2>
                            <p style="color: #666;">Experience the premium expense tracking</p>
                        </div>
                        <p style="font-size: 16px; line-height: 1.6;">Your magic login code is:</p>
                        <div style="background: #fdfdfd; border: 2px dashed #FF5722; padding: 20px; text-align: center; border-radius: 15px; margin: 30px 0;">
                            <h1 style="color: #FF5722; font-size: 48px; letter-spacing: 15px; margin: 0; font-family: monospace;">${code}</h1>
                        </div>
                        <p style="font-size: 14px; color: #999; text-align: center;">This code will expire in 10 minutes.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #aaa; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
                    </div>
                `,
            });
        } catch (resendError: any) {
            console.error("Resend Error:", resendError);
            return NextResponse.json({ error: "Failed to send email. Check your Resend API key." }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Internal error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
