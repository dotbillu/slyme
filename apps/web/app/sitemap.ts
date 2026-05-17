import { MetadataRoute } from "next";
import { fetchAllRooms } from "@/services/room/service";
import { Room } from "@/types/room";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://slyme.dotbillu.in";

  const routes = ["", "/explore", "/search", "/network", "/signin", "/signup"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const rooms = await fetchAllRooms();
    const roomRoutes = rooms.map((room: Room) => ({
      url: `${baseUrl}/explore?room=${room.id}`,
      lastModified: room.createdAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...routes, ...roomRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return routes;
  }
}
