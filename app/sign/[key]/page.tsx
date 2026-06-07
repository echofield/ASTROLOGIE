"use client";

import { useParams } from "next/navigation";
import { territoryByKey } from "@/data/territories";
import Territory from "@/components/atlas/Territory";
import tableJson from "@/data/constellations.json";
import type { ConstellationTable } from "@/types/atlas";
import { NIGHT, FT } from "@/lib/theme";

const table = tableJson as unknown as ConstellationTable;

export default function SignPage() {
  const params = useParams<{ key: string }>();
  const t = territoryByKey(params.key);
  const cdata = table.signs[params.key];

  if (!t || !cdata) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#05080f", color: NIGHT.ink, fontFamily: FT }}>
        <div>Unknown territory. <a href="/" style={{ color: NIGHT.brass }}>Return to the Atlas</a></div>
      </main>
    );
  }
  return <Territory t={t} cdata={cdata} />;
}
