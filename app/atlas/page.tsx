"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AtlasExplorer from "@/components/atlas/AtlasExplorer";

// /atlas — the constellation explorer. ?sign=<key> opens it on a given territory
// (the home wheel routes here); the switcher browses all twelve in-page.
function AtlasRoute() {
  const sign = useSearchParams().get("sign") ?? "aries";
  return <AtlasExplorer initial={sign} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AtlasRoute />
    </Suspense>
  );
}
