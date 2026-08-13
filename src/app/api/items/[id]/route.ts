import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteFileFromStorage } from "@/lib/storage";

export async function GET(
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

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Get item error:", error);
    return NextResponse.json({ error: "Failed to get item" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.url !== undefined) updateData.url = body.url ? body.url.trim() : null;
    if (body.favicon !== undefined) updateData.favicon = body.favicon;
    if (body.tags !== undefined) updateData.tags = body.tags ? body.tags.trim() : null;
    if (body.category !== undefined) updateData.category = body.category ? body.category.trim() : null;
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
    if (body.isFavorite !== undefined) updateData.isFavorite = Boolean(body.isFavorite);

    const updated = await prisma.item.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete stored file if item is a FILE or VIDEO
    if (item.filename) {
      await deleteFileFromStorage(item.filename);
    }

    await prisma.item.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, deletedId: params.id });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
