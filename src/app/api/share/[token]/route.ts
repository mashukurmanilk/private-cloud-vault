import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const share = await prisma.shareLink.findUnique({
      where: { token: params.token },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            originalName: true,
            mimeType: true,
            size: true,
            url: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json({ error: "Share link not found or expired" }, { status: 404 });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
    }

    const requiresPassword = !!share.passwordHash;

    return NextResponse.json({
      share: {
        token: share.token,
        requiresPassword,
        expiresAt: share.expiresAt,
        item: requiresPassword
          ? {
              id: share.item.id,
              title: share.item.title,
              type: share.item.type,
              size: share.item.size,
              mimeType: share.item.mimeType,
            }
          : share.item,
      },
    });
  } catch (error) {
    console.error("Fetch share link error:", error);
    return NextResponse.json({ error: "Failed to access share link" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const { password } = body;

    const share = await prisma.shareLink.findUnique({
      where: { token: params.token },
      include: { item: true },
    });

    if (!share) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
    }

    if (share.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 });
      }
      const isMatch = await verifyPassword(password, share.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid share password" }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: true,
      item: share.item,
    });
  } catch (error) {
    console.error("Verify share link password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
