import { ItineraryEditing, DayActivity, Place } from "./itinerary-types";
import { MOCK_PLACES } from "./mock-places";

// Haversine para distancia en km
export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

// Estimación simple de traslado (minutos): urbano 25km/h, foráneo 60km/h
export function estimateTravelMin(a: Place, b: Place) {
  const km = kmBetween(a.coords, b.coords);
  const avg = (a.state === b.state && a.state === "cdmx") ? 25 : 60;
  return Math.round((km / avg) * 60);
}

export function findPlace(id: string): Place | undefined {
  return MOCK_PLACES.find((p) => p.id === id);
}

export function getPlacesByStates(states: Place["state"][]) {
  return MOCK_PLACES.filter((p) => states.includes(p.state));
}

export function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function minToTime(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Valida traslapes en un día (incluye traslado previo si se especifica)
export function hasOverlap(day: DayActivity[]) {
  const sorted = [...day].sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const prevEnd = timeToMin(prev.end);
    if (timeToMin(cur.start) < prevEnd) return true;
  }
  return false;
}

export function clampEndIfNeeded(start: string, end: string) {
  // asegura que end > start al menos 30min
  const s = timeToMin(start);
  const e = timeToMin(end);
  if (e <= s) return minToTime(s + 30);
  return end;
}

// Serializa el draft a localStorage
export function persistDraft(edit: ItineraryEditing) {
  localStorage.setItem("itinerary_edit_" + edit.id, JSON.stringify(edit));
}
export function loadDraft(id: string): ItineraryEditing | null {
  const raw = localStorage.getItem("itinerary_edit_" + id);
  return raw ? (JSON.parse(raw) as ItineraryEditing) : null;
}
