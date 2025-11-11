// Tipos base del editor de itinerarios

export type LatLng = { lat: number; lng: number };

export type PlaceCategory =
  | "museo"
  | "parque"
  | "mirador"
  | "gastronomia"
  | "historia"
  | "arte"
  | "noche"
  | "shopping"
  | "naturaleza";

export type Place = {
  id: string;
  name: string;
  state: "cdmx" | "edomex" | "hidalgo" | "morelos" | "queretaro";
  category: PlaceCategory[];
  coords: LatLng;
  popularity: number; // 0..100
  avgStayMin: number; // estancia sugerida en minutos
  description?: string;
  tags?: string[];
};

export type DayActivity = {
  id: string;
  placeId: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  notes?: string;
  travelMinFromPrev?: number; // tiempo estimado de traslado desde anterior
};

export type ItineraryEditing = {
  id: string;
  title: string;
  style?: "cultural" | "familiar" | "gastronómico" | "romántico" | "fotografía";
  visibility: "private" | "friends" | "public";
  states: Array<Place["state"]>;

  startISO: string; // yyyy-mm-dd
  endISO: string;   // yyyy-mm-dd

  // key = ISO date
  days: Record<string, DayActivity[]>;
};
