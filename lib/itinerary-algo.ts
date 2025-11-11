// lib/itinerary-algo.ts
import { Place, PLACES, StateKey, centerForStates } from "./mock-itinerary-data";

/** Distancia Haversine (km) */
const R = 6371;
export function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const la1 = toRad(a[0]), la2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estima tiempo (min) con velocidades urbanas/interurbanas simples */
export function etaMinutesKm(distanceKm: number, crossStates = false) {
  const vUrban = 28;     // km/h en ciudad
  const vInter = 65;     // km/h entre ciudades
  const v = crossStates ? vInter : vUrban;
  return Math.round((distanceKm / v) * 60);
}

/** Calcula la ruta del día (polyline simple por puntos) y métricas */
export function buildDayRoute(placeIds: string[]): {
  coords: [number, number][],
  legs: { from: Place; to: Place; km: number; min: number }[],
  totalKm: number; totalMin: number;
} {
  const pts = placeIds
    .map(id => PLACES.find(p => p.id_api_place === id))
    .filter((p): p is Place => Boolean(p));

  const coords: [number, number][] = pts.map(p => [p.latitud, p.longitud]);
  const legs: { from: Place; to: Place; km: number; min: number }[] = [];

  let totalKm = 0;
  let totalMin = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const km = haversineKm([a.latitud, a.longitud], [b.latitud, b.longitud]);
    const cross = a.state !== b.state;
    const min = etaMinutesKm(km, cross);
    totalKm += km; totalMin += min;
    legs.push({ from: a, to: b, km: Math.round(km * 10) / 10, min });
  }

  return { coords, legs, totalKm: Math.round(totalKm * 10) / 10, totalMin };
}

/** Sugerencias para un día específico */
export function suggestForDay(params: {
  dayPlaceIds: string[];
  states: StateKey[];
  radiusKm: number;
  q?: string;
  category?: Place["category"] | "all";
  activityFilters?: string[];
  styleTags?: string[]; // p.ej. ['romántico','familia','foodie']
  limit?: number;
}) {
  const {
    dayPlaceIds, states, radiusKm, q,
    category, activityFilters = [], styleTags = [], limit = 12
  } = params;

  const { lat: cLat, lng: cLng } = centerForStates(states);
  const selected = dayPlaceIds
    .map(id => PLACES.find(p => p.id_api_place === id))
    .filter((p): p is Place => Boolean(p));

  const base = PLACES.filter(p => states.includes(p.state));

  const norm = (s?: string) => (s || "").toLowerCase();
  const qNorm = norm(q);

  // Scoring:
  // + popularidad
  // + coincidencia por query/actividad/estilo
  // + cercanía a último punto del día (o centro)
  // - penalización por distancia excesiva > radiusKm
  const last = selected.at(-1);
  const ref: [number, number] = last ? [last.latitud, last.longitud] : [cLat, cLng];

  const scored = base
    // evita duplicar los ya seleccionados
    .filter(p => !dayPlaceIds.includes(p.id_api_place))
    .map(p => {
      const text = [
        p.nombre, p.category, p.short_desc || "", ...(p.tags || [])
      ].join(" ").toLowerCase();

      const matchQ = qNorm ? (text.includes(qNorm) ? 1 : 0) : 0;

      const matchAct = activityFilters.length
        ? activityFilters.some(a => text.includes(a)) ? 1 : 0
        : 0;

      const matchStyle = styleTags.length
        ? styleTags.some(t => text.includes(t)) ? 1 : 0
        : 0;

      const catOk = !category || category === "all" || p.category === category;
      if (!catOk) return null;

      const km = haversineKm(ref, [p.latitud, p.longitud]);
      const nearBonus = km < radiusKm ? 1 : 0;
      const distPenalty = Math.max(0, km - radiusKm); // penaliza fuera de radio
      // score final
      const score =
        p.google_score * 2 +
        matchQ * 1.2 +
        matchAct * 1.5 +
        matchStyle * 1.1 +
        nearBonus * 0.8 -
        distPenalty * 0.02;

      return { place: p, score, km };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.score - a!.score))
    .slice(0, limit)
    .map(s => ({ ...s!, km: Math.round(s!.km * 10) / 10 }));

  return scored;
}

/** Señales de alerta logística por tramo o por día */
export function logisticsAlerts(dayPlaceIds: string[]): {
  longLegs: { from: string; to: string; km: number; min: number }[];
  totals: { totalKm: number; totalMin: number };
  hasIssue: boolean;
} {
  const { legs, totalKm, totalMin } = buildDayRoute(dayPlaceIds);
  const longLegs = legs.filter(l => l.km >= 120 || l.min >= 120); // 120 km o 2h aprox
  return {
    longLegs: longLegs.map(l => ({
      from: l.from.nombre, to: l.to.nombre, km: l.km, min: l.min
    })),
    totals: { totalKm, totalMin },
    hasIssue: longLegs.length > 0 || totalKm > 250 // umbral total por día
  };
}



export function estimateLegFromRef(
  ref: [number, number],
  place: Place
): { km: number; min: number; crossState: boolean } {
  const km = Math.round(haversineKm(ref, [place.latitud, place.longitud]) * 10) / 10;
  const min = etaMinutesKm(km, false);
  return { km, min, crossState: false };
}
