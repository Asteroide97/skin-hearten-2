import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/productos", "/producto/", "/blog", "/reviews", "/cuenta"],
        disallow: [
          "/admin/",
          "/api/",
          "/carrito",
          "/checkout/",
          "/ingresar",
          "/registro",
          "/recuperar-contrasena",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
