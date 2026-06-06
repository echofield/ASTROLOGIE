// Offline fallback for the most common birth cities, so geocoding never depends
// on a flaky third party for the typical user. Long tail still hits Nominatim.
// Keys are lowercased city names. Francophone markets first.

export interface City { lat: number; lon: number; label: string }

export const CITIES: Record<string, City> = {
  // France + francophone
  paris: { lat: 48.8566, lon: 2.3522, label: "Paris, France" },
  lyon: { lat: 45.7640, lon: 4.8357, label: "Lyon, France" },
  marseille: { lat: 43.2965, lon: 5.3698, label: "Marseille, France" },
  toulouse: { lat: 43.6047, lon: 1.4442, label: "Toulouse, France" },
  nice: { lat: 43.7102, lon: 7.2620, label: "Nice, France" },
  nantes: { lat: 47.2184, lon: -1.5536, label: "Nantes, France" },
  bordeaux: { lat: 44.8378, lon: -0.5792, label: "Bordeaux, France" },
  lille: { lat: 50.6292, lon: 3.0573, label: "Lille, France" },
  strasbourg: { lat: 48.5734, lon: 7.7521, label: "Strasbourg, France" },
  montpellier: { lat: 43.6108, lon: 3.8767, label: "Montpellier, France" },
  rennes: { lat: 48.1173, lon: -1.6778, label: "Rennes, France" },
  grenoble: { lat: 45.1885, lon: 5.7245, label: "Grenoble, France" },
  brussels: { lat: 50.8503, lon: 4.3517, label: "Brussels, Belgium" },
  bruxelles: { lat: 50.8503, lon: 4.3517, label: "Bruxelles, Belgique" },
  geneva: { lat: 46.2044, lon: 6.1432, label: "Geneva, Switzerland" },
  geneve: { lat: 46.2044, lon: 6.1432, label: "Genève, Suisse" },
  lausanne: { lat: 46.5197, lon: 6.6323, label: "Lausanne, Switzerland" },
  montreal: { lat: 45.5019, lon: -73.5674, label: "Montréal, Canada" },
  quebec: { lat: 46.8139, lon: -71.2080, label: "Québec, Canada" },
  dakar: { lat: 14.7167, lon: -17.4677, label: "Dakar, Senegal" },
  abidjan: { lat: 5.3600, lon: -4.0083, label: "Abidjan, Côte d'Ivoire" },
  casablanca: { lat: 33.5731, lon: -7.5898, label: "Casablanca, Morocco" },
  rabat: { lat: 34.0209, lon: -6.8416, label: "Rabat, Morocco" },
  tunis: { lat: 36.8065, lon: 10.1815, label: "Tunis, Tunisia" },
  algiers: { lat: 36.7538, lon: 3.0588, label: "Algiers, Algeria" },
  alger: { lat: 36.7538, lon: 3.0588, label: "Alger, Algérie" },
  // Europe
  london: { lat: 51.5074, lon: -0.1278, label: "London, UK" },
  madrid: { lat: 40.4168, lon: -3.7038, label: "Madrid, Spain" },
  barcelona: { lat: 41.3851, lon: 2.1734, label: "Barcelona, Spain" },
  rome: { lat: 41.9028, lon: 12.4964, label: "Rome, Italy" },
  milan: { lat: 45.4642, lon: 9.1900, label: "Milan, Italy" },
  berlin: { lat: 52.5200, lon: 13.4050, label: "Berlin, Germany" },
  munich: { lat: 48.1351, lon: 11.5820, label: "Munich, Germany" },
  amsterdam: { lat: 52.3676, lon: 4.9041, label: "Amsterdam, Netherlands" },
  vienna: { lat: 48.2082, lon: 16.3738, label: "Vienna, Austria" },
  zurich: { lat: 47.3769, lon: 8.5417, label: "Zurich, Switzerland" },
  lisbon: { lat: 38.7223, lon: -9.1393, label: "Lisbon, Portugal" },
  dublin: { lat: 53.3498, lon: -6.2603, label: "Dublin, Ireland" },
  athens: { lat: 37.9838, lon: 23.7275, label: "Athens, Greece" },
  istanbul: { lat: 41.0082, lon: 28.9784, label: "Istanbul, Turkey" },
  moscow: { lat: 55.7558, lon: 37.6173, label: "Moscow, Russia" },
  // Americas
  "new york": { lat: 40.7128, lon: -74.0060, label: "New York, USA" },
  "los angeles": { lat: 34.0522, lon: -118.2437, label: "Los Angeles, USA" },
  chicago: { lat: 41.8781, lon: -87.6298, label: "Chicago, USA" },
  "san francisco": { lat: 37.7749, lon: -122.4194, label: "San Francisco, USA" },
  miami: { lat: 25.7617, lon: -80.1918, label: "Miami, USA" },
  toronto: { lat: 43.6532, lon: -79.3832, label: "Toronto, Canada" },
  "mexico city": { lat: 19.4326, lon: -99.1332, label: "Mexico City, Mexico" },
  "sao paulo": { lat: -23.5505, lon: -46.6333, label: "São Paulo, Brazil" },
  "buenos aires": { lat: -34.6037, lon: -58.3816, label: "Buenos Aires, Argentina" },
  // Africa / Middle East
  cairo: { lat: 30.0444, lon: 31.2357, label: "Cairo, Egypt" },
  lagos: { lat: 6.5244, lon: 3.3792, label: "Lagos, Nigeria" },
  nairobi: { lat: -1.2921, lon: 36.8219, label: "Nairobi, Kenya" },
  johannesburg: { lat: -26.2041, lon: 28.0473, label: "Johannesburg, South Africa" },
  dubai: { lat: 25.2048, lon: 55.2708, label: "Dubai, UAE" },
  // Asia / Oceania
  mumbai: { lat: 19.0760, lon: 72.8777, label: "Mumbai, India" },
  delhi: { lat: 28.6139, lon: 77.2090, label: "Delhi, India" },
  singapore: { lat: 1.3521, lon: 103.8198, label: "Singapore" },
  "hong kong": { lat: 22.3193, lon: 114.1694, label: "Hong Kong" },
  tokyo: { lat: 35.6762, lon: 139.6503, label: "Tokyo, Japan" },
  seoul: { lat: 37.5665, lon: 126.9780, label: "Seoul, South Korea" },
  shanghai: { lat: 31.2304, lon: 121.4737, label: "Shanghai, China" },
  beijing: { lat: 39.9042, lon: 116.4074, label: "Beijing, China" },
  sydney: { lat: -33.8688, lon: 151.2093, label: "Sydney, Australia" },
  melbourne: { lat: -37.8136, lon: 144.9631, label: "Melbourne, Australia" },
};

/** Match a free-text place against the bundled list (first comma-segment). */
export function lookupCity(q: string): City | null {
  const head = q.toLowerCase().split(",")[0].trim();
  return CITIES[head] ?? null;
}
