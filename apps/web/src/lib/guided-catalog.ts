import type { Product } from "@/lib/types";

export type GuidedCatalogProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "brand"
  | "category"
  | "price"
  | "compareAtPrice"
  | "image"
  | "images"
  | "stock"
  | "description"
  | "benefits"
  | "ingredients"
  | "usage"
  | "skinTypes"
  | "concerns"
  | "highlight"
  | "gradient"
  | "featured"
  | "bestSeller"
  | "rating"
>;

export function toGuidedCatalogProduct(product: Product): GuidedCatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.image,
    images: product.images,
    stock: product.stock,
    description: product.description,
    benefits: product.benefits,
    ingredients: product.ingredients,
    usage: product.usage,
    skinTypes: product.skinTypes,
    concerns: product.concerns,
    highlight: product.highlight,
    gradient: product.gradient,
    featured: product.featured,
    bestSeller: product.bestSeller,
    rating: product.rating,
  };
}

export function toGuidedCatalogProducts(products: Product[]) {
  return products.map(toGuidedCatalogProduct);
}
