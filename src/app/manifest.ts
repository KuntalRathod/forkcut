import type { MetadataRoute } from "next";
import { DESCRIPTION, SITE_NAME } from "./site";

/** Installable, because an editor that needs no server has no reason to need a tab either. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forkcut — video editor with version control",
    short_name: SITE_NAME,
    description: DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#14100d",
    theme_color: "#14100d",
    categories: ["productivity", "photo", "utilities"],
    icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
