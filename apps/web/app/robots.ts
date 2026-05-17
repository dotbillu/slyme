import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/search", "/network"],
      disallow: ["/api/", "/signin", "/signup"],
    },
    sitemap: "https://slyme.dotbillu.in/sitemap.xml",
  };
}
