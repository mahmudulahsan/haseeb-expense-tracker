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

        if (process.env.NODE_ENV !== "production") {
            console.log(`\n========================================\n[DEV OTP] Email: ${email} | Code: ${code}\n========================================\n`);
        }

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
            const fromEmail = process.env.EMAIL_FROM || "Haseeb <no-reply@trionslab.com>";
            const { data, error: sendError } = await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: "Your Login Code - Haseeb",
                html: `
                    <div style="font-family: sans-serif; padding: 40px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="margin-top: 24px; color: #111; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Haseeb</h2>
                            <p style="color: #666; font-size: 16px; margin-top: 4px;">Experience expense tracking with fun</p>
                        </div>
                        <p style="font-size: 16px; line-height: 1.6;">Your OTP:</p>
                        <div style="background: #fdfdfd; border: 2px dashed #f97316; padding: 20px; text-align: center; border-radius: 15px; margin: 30px 0;">
                            <h1 style="color: #f97316; font-size: 48px; letter-spacing: 15px; margin: 0; font-family: monospace;">${code}</h1>
                        </div>
                        <p style="font-size: 14px; color: #999; text-align: center;">This code will expire in 10 minutes.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #aaa; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
                    </div>
                `,
            });

            if (sendError) {
                console.error("Resend Send Error:", sendError);
                return NextResponse.json({ error: sendError.message || "Failed to send email via Resend." }, { status: 500 });
            }
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
