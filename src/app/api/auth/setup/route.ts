import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie, isSetupComplete } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const isSetup = await isSetupComplete();
    if (isSetup) {
      return NextResponse.json(
        { error: "Vault is already initialized with a master account." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { username, password, pinCode } = body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Master password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    let hashedPin = null;
    if (pinCode && typeof pinCode === "string" && pinCode.trim().length >= 4) {
      hashedPin = await hashPassword(pinCode.trim());
    }

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        pinCode: hashedPin,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        hasPin: !!user.pinCode,
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Internal server error during vault setup." },
      { status: 500 }
    );
  }
}
