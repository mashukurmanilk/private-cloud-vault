import { NextResponse } from "next/server";
import { getCurrentUser, isSetupComplete } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isSetup = await isSetupComplete();
    const user = await getCurrentUser();

    return NextResponse.json({
      isSetup,
      authenticated: !!user,
      user: user
        ? {
            id: user.id,
            username: user.username,
            hasPin: !!user.pinCode,
          }
        : null,
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    );
  }
}
