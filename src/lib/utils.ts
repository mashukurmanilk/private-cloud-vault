import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openAddModal(tab: "files" | "link" | "note" = "files") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vault:open-add", { detail: { tab } }));
  }
}

export function formatBytes(bytes?: number | null, decimals = 1): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function getFileCategory(mimeType?: string | null, originalName?: string | null): string {
  if (!mimeType && !originalName) return "file";
  const mime = (mimeType || "").toLowerCase();
  const ext = (originalName || "").split(".").pop()?.toLowerCase() || "";

  if (mime.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi", "m4v"].includes(ext)) {
    return "video";
  }
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
    return "image";
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(ext)) {
    return "audio";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("text/markdown") ||
    ["doc", "docx", "txt", "md", "rtf", "odt"].includes(ext)
  ) {
    return "doc";
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    return "sheet";
  }
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    ["ppt", "pptx"].includes(ext)
  ) {
    return "presentation";
  }
  if (
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    mime.includes("compressed") ||
    ["zip", "tar", "gz", "7z", "rar", "bz2"].includes(ext)
  ) {
    return "archive";
  }
  if (
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("html") ||
    mime.includes("css") ||
    ["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "rs", "go", "php", "sql", "sh", "json", "html", "css"].includes(ext)
  ) {
    return "code";
  }
  return "file";
}
