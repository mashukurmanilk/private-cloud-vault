import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Private Cloud Vault",
    short_name: "Vault",
    description: "Your private, self-hosted personal cloud for files, videos, links, and notes",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
