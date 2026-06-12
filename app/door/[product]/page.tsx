import { notFound } from "next/navigation";
import { Suspense } from "react";
import Doorway from "@/components/door/Doorway";
import { getProduct, liveProducts } from "@/lib/products/registry";

// /door/[product] — the doorway shell, masked by the registry. One route for
// every door; adding a door is adding a config. Dark or unknown products 404.
export function generateStaticParams() {
  return liveProducts().filter((p) => p.door).map((p) => ({ product: p.productId }));
}
// the registry's doors are the only doors — unknown slugs 404 at the router
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ product: string }> }) {
  const cfg = getProduct((await params).product);
  if (!cfg?.door || !cfg.live) return { title: "The AstroLab" };
  return { title: `${cfg.displayName} — The AstroLab`, description: cfg.door.tag };
}

export default async function DoorPage({ params }: { params: Promise<{ product: string }> }) {
  const cfg = getProduct((await params).product);
  if (!cfg?.door || !cfg.live) notFound();
  return (
    <Suspense fallback={null}>
      <Doorway cfg={cfg} />
    </Suspense>
  );
}
