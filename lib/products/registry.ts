import type { ProductConfig, ProductId } from "./types";
import { core } from "./core";
import { lucy } from "./lucy";
import { shadow } from "./shadow";
import { path } from "./path";

// The registry — one machine, multiple masks. Routes, checkout and the webhook
// all resolve products HERE; nothing else may hardcode a product.
const PRODUCTS: Record<ProductId, ProductConfig> = { core, lucy, shadow, path };

export function getProduct(id: string | null | undefined): ProductConfig | null {
  if (!id) return null;
  const p = (PRODUCTS as Record<string, ProductConfig>)[id];
  return p ?? null;
}

/** Doors that render and sell. Drafts stay dark. */
export function liveProducts(): ProductConfig[] {
  return Object.values(PRODUCTS).filter((p) => p.live);
}

export function allProducts(): ProductConfig[] {
  return Object.values(PRODUCTS);
}
