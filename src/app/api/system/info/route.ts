import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStorageStats } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import os from "os";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get network interfaces to find LAN IP addresses
    const networkInterfaces = os.networkInterfaces();
    const localIps: string[] = [];

    for (const name of Object.keys(networkInterfaces)) {
      const netList = networkInterfaces[name];
      if (netList) {
        for (const net of netList) {
          // Skip internal (127.0.0.1) and non-ipv4 addresses
          if (net.family === "IPv4" && !net.internal) {
            localIps.push(net.address);
          }
        }
      }
    }

    const host = req.headers.get("host") || "localhost:3000";
    const port = host.includes(":") ? host.split(":")[1] : "3000";

    const primaryIp = localIps.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) || localIps[0] || "localhost";
    const localUrl = `http://${primaryIp}:${port}`;

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(localUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
    } catch (qrErr) {
      console.warn("QR code generation error:", qrErr);
    }

    const [storage, fileCount, videoCount, linkCount, noteCount, favoriteCount] = await Promise.all([
      getStorageStats(),
      prisma.item.count({ where: { userId: user.id, type: "FILE" } }),
      prisma.item.count({ where: { userId: user.id, type: "VIDEO" } }),
      prisma.item.count({ where: { userId: user.id, type: "LINK" } }),
      prisma.item.count({ where: { userId: user.id, type: "NOTE" } }),
      prisma.item.count({ where: { userId: user.id, isFavorite: true } }),
    ]);

    return NextResponse.json({
      localIps,
      primaryIp,
      port,
      localUrl,
      qrCodeDataUrl,
      storage: {
        usedBytes: storage.totalBytes,
        diskFilesCount: storage.fileCount,
      },
      counts: {
        files: fileCount,
        videos: videoCount,
        links: linkCount,
        notes: noteCount,
        favorites: favoriteCount,
        total: fileCount + videoCount + linkCount + noteCount,
      },
      system: {
        platform: os.platform(),
        hostname: os.hostname(),
      },
    });
  } catch (error) {
    console.error("System info error:", error);
    return NextResponse.json({ error: "Failed to get system info" }, { status: 500 });
  }
}
