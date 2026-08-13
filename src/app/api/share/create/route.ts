import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, password, expiresInHours } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        userId: user.id,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const token = crypto.randomBytes(12).toString("hex");
    let passwordHash = null;
    if (password && typeof password === "string" && password.trim()) {
      passwordHash = await hashPassword(password.trim());
    }

    let expiresAt = null;
    if (expiresInHours && typeof expiresInHours === "number" && expiresInHours > 0) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const share = await prisma.shareLink.create({
      data: {
        itemId: item.id,
        token,
        passwordHash,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      share: {
        id: share.id,
        token: share.token,
        expiresAt: share.expiresAt,
        hasPassword: !!share.passwordHash,
      },
    });
  } catch (error) {
    console.error("Create share link error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
