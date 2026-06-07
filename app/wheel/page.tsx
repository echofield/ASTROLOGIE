import WheelLanding from "@/components/landing/WheelLanding";

// Prototype homepage direction D — the clickable zodiac wheel.
// Lives at /wheel so it can be tasted next to A/B/C without touching the live home.
export const metadata = { title: "The AstroLab — Wheel" };

export default function WheelPage() {
  return <WheelLanding />;
}
