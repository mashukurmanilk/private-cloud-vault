import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";

// Unlock with PIN
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pinCode } = body;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser || !fullUser.pinCode) {
      return NextResponse.json({ error: "PIN is not set." }, { status: 400 });
    }

    const isValid = await verifyPassword(pinCode, fullUser.pinCode);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid PIN code." }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PIN check error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// Update / Set PIN
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pinCode, masterPassword } = body;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await verifyPassword(masterPassword, fullUser.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid master password confirmation." }, { status: 401 });
    }

    let hashedPin = null;
    if (pinCode && typeof pinCode === "string" && pinCode.trim().length >= 4) {
      hashedPin = await hashPassword(pinCode.trim());
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { pinCode: hashedPin },
    });

    return NextResponse.json({ success: true, hasPin: !!hashedPin });
  } catch (error) {
    console.error("PIN update error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
