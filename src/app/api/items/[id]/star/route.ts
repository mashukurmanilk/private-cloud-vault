import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await prisma.item.update({
      where: { id: params.id },
      data: { isFavorite: !item.isFavorite },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Star toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle star" }, { status: 500 });
  }
}
