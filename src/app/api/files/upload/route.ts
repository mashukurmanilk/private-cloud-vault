import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveFileBuffer } from "@/lib/storage";
import { getFileCategory } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const category = (formData.get("category") as string) || null;
    const tags = (formData.get("tags") as string) || null;

    if (!files || files.length === 0) {
      // Check for single "file" field
      const singleFile = formData.get("file") as File;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedItems = [];

    for (const file of files) {
      const originalName = file.name || "unnamed-file";
      const mimeType = file.type || "application/octet-stream";
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { filename, size } = await saveFileBuffer(buffer, originalName);
      const detectedCat = getFileCategory(mimeType, originalName);
      const itemType = detectedCat === "video" ? "VIDEO" : "FILE";

      const item = await prisma.item.create({
        data: {
          userId: user.id,
          type: itemType,
          title: originalName,
          filename,
          originalName,
          mimeType,
          size,
          category: category ? category.trim() : null,
          tags: tags ? tags.trim() : null,
        },
      });

      uploadedItems.push(item);
    }

    return NextResponse.json({
      success: true,
      items: uploadedItems,
      count: uploadedItems.length,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file(s)." },
      { status: 500 }
    );
  }
}
