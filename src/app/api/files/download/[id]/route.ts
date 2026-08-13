import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFilePath } from "@/lib/storage";
import fs from "fs";
import mime from "mime-types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const shareToken = searchParams.get("share");

    let item = null;

    if (shareToken) {
      const share = await prisma.shareLink.findUnique({
        where: { token: shareToken },
        include: { item: true },
      });

      if (share && (!share.expiresAt || new Date(share.expiresAt) > new Date())) {
        item = share.item;
        // Increment download count
        await prisma.shareLink.update({
          where: { id: share.id },
          data: { downloads: { increment: 1 } },
        });
      }
    }

    if (!item) {
      const user = await getCurrentUser();
      if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      item = await prisma.item.findFirst({
        where: {
          id: params.id,
          userId: user.id,
        },
      });
    }

    if (!item || !item.filename) {
      return new NextResponse("File not found", { status: 404 });
    }

    const filePath = getFilePath(item.filename);
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File missing on disk", { status: 404 });
    }

    const stat = await fs.promises.stat(filePath);
    const mimeType = item.mimeType || mime.lookup(filePath) || "application/octet-stream";
    const downloadName = encodeURIComponent(item.originalName || item.title || "download");

    const fileStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        "Content-Length": stat.size.toString(),
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${downloadName}`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
