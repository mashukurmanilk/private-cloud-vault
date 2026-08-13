import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), process.env.STORAGE_DIR || "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

export function getFilePath(filename: string): string {
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, safeFilename);
}

export async function saveFileBuffer(buffer: Buffer, originalFilename: string): Promise<{ filename: string; size: number }> {
  const ext = path.extname(originalFilename);
  const randomPrefix = crypto.randomBytes(16).toString("hex");
  const storedFilename = `${Date.now()}-${randomPrefix}${ext}`;
  const targetPath = path.join(UPLOADS_DIR, storedFilename);

  await fs.promises.writeFile(targetPath, buffer);
  const stats = await fs.promises.stat(targetPath);

  return {
    filename: storedFilename,
    size: stats.size,
  };
}

export async function deleteFileFromStorage(filename: string): Promise<boolean> {
  try {
    const targetPath = getFilePath(filename);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error deleting file from storage:", err);
    return false;
  }
}

export async function getStorageStats(): Promise<{ totalBytes: number; fileCount: number }> {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return { totalBytes: 0, fileCount: 0 };
    }

    const files = await fs.promises.readdir(UPLOADS_DIR);
    let totalBytes = 0;

    for (const file of files) {
      try {
        const stats = await fs.promises.stat(path.join(UPLOADS_DIR, file));
        if (stats.isFile()) {
          totalBytes += stats.size;
        }
      } catch {
        // ignore missing file
      }
    }

    return {
      totalBytes,
      fileCount: files.length,
    };
  } catch (err) {
    console.error("Error reading storage stats:", err);
    return { totalBytes: 0, fileCount: 0 };
  }
}
