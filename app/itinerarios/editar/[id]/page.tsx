"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

import { MX_STATES, StateKey } from "@/lib/mock-itinerary-data";
import { safeStorage } from "@/lib/safe-storage";

import {
  ItineraryProvider,
  EditState,
} from "@/components/itinerary/editor-context";
import DayPlan from "@/components/itinerary/DayPlan";
import SearchPanel from "@/components/itinerary/SearchPanel";
import Inspector from "@/components/itinerary/Inspector";
import ItineraryMap from "@/components/map/itinerary-map";
import { centerForStates, PLACES } from "@/lib/mock-itinerary-data";
import { useItinerary } from "@/components/itinerary/editor-context"; // para MapPanel

function MapPanel() {
  const { st, route, activePlaceIds } = useItinerary();
  const c = centerForStates(st.states);
  const markers = activePlaceIds
    .map((id) => PLACES.find((p) => p.id_api_place === id))
    .filter(Boolean)
    .map((p) => [p!.latitud, p!.longitud]) as [number, number][];
  return (
    <div className="h-[78vh] grid grid-rows-[1fr_auto] gap-4">
      <div className="rounded-2xl overflow-hidden border">
        <ItineraryMap
          center={[c.lat, c.lng]}
          zoom={11}
          coords={route.coords as [number, number][]}
          markers={markers}
        />
      </div>
      <Inspector />
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => {
    const v = params?.id as unknown;
    return Array.isArray(v) ? (v[0] as string) : (v as string);
  }, [params]);

  // estado inicial robusto (sin romper orden de hooks)
  const initial: EditState = useMemo(() => {
    const draftRaw = id ? safeStorage.get(`sp_edit_${id}`) : null;
    if (draftRaw) return JSON.parse(draftRaw) as EditState;

    // fallback si no hay nada
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    return {
      id: String(id ?? "new"),
      title: "Mi itinerario",
      states: ["cdmx"] as StateKey[],
      startDate: iso,
      endDate: iso,
      activeDayISO: iso,
      byDay: { [iso]: [] },
      radiusKm: 40,
      q: "",
      category: "all",
      styleTags: [],
    };
  }, [id]);

  return (
    <ItineraryProvider initial={initial}>
      <div className="w-full min-h-screen p-3 md:p-5">
        {/* top bar */}
        <TopBar onBack={() => router.back()} />
        {/* layout 3 columnas */}
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-[minmax(380px,0.95fr)_minmax(520px,1.3fr)_minmax(640px,1.5fr)]">
          <DayPlan />
          <SearchPanel />
          <MapPanel />
        </div>
      </div>
    </ItineraryProvider>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  const { st, setSt } = useItinerary();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Input
          className="w-[min(60vw,520px)]"
          value={st.title}
          onChange={(e) => setSt((s) => ({ ...s, title: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex flex-wrap gap-2">
          {st.states.map((k) => (
            <Badge key={k} variant="outline">
              {MX_STATES.find((s) => s.key === k)?.label}
            </Badge>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() =>
            safeStorage.set(`sp_edit_${st.id}`, JSON.stringify(st))
          }
        >
          <Save className="h-4 w-4 mr-2" /> Guardar
        </Button>
      </div>
    </div>
  );
}
