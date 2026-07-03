import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/shared/json-ld";
import { ArrowUpRightIcon } from "@/components/shared/icons";
import { SectionHeading } from "@/components/shared/section-heading";
import { absoluteUrl, buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildPublicMetadata } from "@/lib/seo";
import { blogPosts } from "@/lib/site-data";

export const metadata: Metadata = buildPublicMetadata({
  title: "Blog editorial de skincare",
  description:
    "Articulos editoriales sobre rutinas, ingredientes, protector solar y cuidado de la piel en tono premium.",
  path: "/blog",
});

export default function BlogListingPage() {
  const featuredPost = blogPosts[0];
  const remainingPosts = blogPosts.slice(1);
  const blogSchemas = [
    buildCollectionPageJsonLd({
      path: "/blog",
      name: "Blog Skin Hearten",
      description:
        "Articulos editoriales de Skin Hearten sobre rutinas, ingredientes y educacion en skincare.",
    }),
    buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Blog", path: "/blog" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Articulos del blog Skin Hearten",
      itemListElement: blogPosts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/blog/${post.slug}`),
        name: post.title,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8">
      <JsonLd data={blogSchemas} />
      <SectionHeading
        eyebrow="Diario Skin Hearten"
        title="Contenido editorial para reforzar autoridad y conversion"
        description="Una lectura premium, util y respirable que acompana la compra sin parecer un blog generico."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Link
          className="overflow-hidden rounded-[2.1rem] border border-stone-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1"
          href={`/blog/${featuredPost.slug}`}
        >
          <div className="grid min-h-[460px] gap-6 bg-gradient-to-br from-[#f7efe8] via-white to-[#f3e5dc] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Portada</p>
                <p className="mt-2 text-sm text-stone-500">{featuredPost.publishedAt}</p>
              </div>
              <span className="rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600">
                Skincare editorial
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-end">
              <h1 className="max-w-2xl font-serif text-4xl leading-tight text-stone-900 sm:text-5xl">
                {featuredPost.title}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-stone-700 sm:text-base">
                {featuredPost.excerpt}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-900">
                Leer articulo
                <ArrowUpRightIcon />
              </div>
            </div>
          </div>
        </Link>

        <div className="grid gap-6">
          {remainingPosts.map((post, index) => (
            <Link
              className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1"
              href={`/blog/${post.slug}`}
              key={post.id}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">
                Columna 0{index + 1}
              </p>
              <h2 className="mt-5 font-serif text-3xl leading-tight text-stone-900">{post.title}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{post.excerpt}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
                <span>{post.author}</span>
                <span>{post.publishedAt}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
