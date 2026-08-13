import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'FILE' | 'VIDEO' | 'LINK' | 'NOTE' or undefined
    const search = searchParams.get("search") || "";
    const isFavorite = searchParams.get("favorite") === "true";
    const isPinned = searchParams.get("pinned") === "true";
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: any = {
      userId: user.id,
    };

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (isFavorite) {
      where.isFavorite = true;
    }

    if (isPinned) {
      where.isPinned = true;
    }

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        contains: tag,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { content: { contains: search } },
        { originalName: { contains: search } },
        { url: { contains: search } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Fetch items error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, content, url, favicon, description, tags, category, isPinned } = body;

    if (!type || !["LINK", "NOTE"].includes(type)) {
      return NextResponse.json({ error: "Invalid item type for this endpoint" }, { status: 400 });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        userId: user.id,
        type,
        title: title.trim(),
        description: description ? description.trim() : null,
        content: content ? content : null,
        url: url ? url.trim() : null,
        favicon: favicon ? favicon.trim() : null,
        tags: tags ? tags.trim() : null,
        category: category ? category.trim() : null,
        isPinned: !!isPinned,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
