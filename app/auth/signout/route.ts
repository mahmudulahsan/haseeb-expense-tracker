import { logout } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    await logout();

    return NextResponse.redirect(new URL("/login", request.url), {
        status: 302,
    });
}
