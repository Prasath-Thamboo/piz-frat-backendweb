import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pizza Fratelli — Espace interne",
    short_name: "PF Interne",
    description:
      "Espace Admin, Cuisine et Livreur — Pizza Fratelli",
    start_url: "/connexion",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#b91c1c",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
