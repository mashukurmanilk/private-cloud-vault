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
    const fileSize = stat.size;
    const mimeType = item.mimeType || mime.lookup(filePath) || "application/octet-stream";

    const range = req.headers.get("range");

    if (range) {
      // HTTP 206 Range request for video/audio streaming and scrubbing
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      // Convert Node readable stream to Web standard ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      // Full file response
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
          "Content-Length": fileSize.toString(),
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (error) {
    console.error("Stream error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
