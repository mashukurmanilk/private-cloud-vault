import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }
      parsedUrl = new URL(formattedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let title = parsedUrl.hostname;
    let description = "";
    let favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
    let image = "";

    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VaultBot/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        title =
          $('meta[property="og:title"]').attr("content") ||
          $('meta[name="twitter:title"]').attr("content") ||
          $("title").first().text() ||
          parsedUrl.hostname;

        description =
          $('meta[property="og:description"]').attr("content") ||
          $('meta[name="twitter:description"]').attr("content") ||
          $('meta[name="description"]').attr("content") ||
          "";

        const iconHref =
          $('link[rel="icon"]').attr("href") ||
          $('link[rel="shortcut icon"]').attr("href") ||
          $('link[rel="apple-touch-icon"]').attr("href");

        if (iconHref) {
          try {
            favicon = new URL(iconHref, parsedUrl.origin).toString();
          } catch {
            // keep google favicon fallback
          }
        }

        const ogImage =
          $('meta[property="og:image"]').attr("content") ||
          $('meta[name="twitter:image"]').attr("content");

        if (ogImage) {
          try {
            image = new URL(ogImage, parsedUrl.origin).toString();
          } catch {
            image = "";
          }
        }
      }
    } catch (fetchErr) {
      console.warn("Error scraping metadata for URL:", url, fetchErr);
    }

    return NextResponse.json({
      url: parsedUrl.toString(),
      title: title.trim(),
      description: description.trim(),
      favicon,
      image,
      domain: parsedUrl.hostname,
    });
  } catch (error) {
    console.error("Link scraper error:", error);
    return NextResponse.json({ error: "Failed to scrape link" }, { status: 500 });
  }
}
