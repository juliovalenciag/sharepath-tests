"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TimeRangePicker from "@/components/ui/time-range-picker";
import { Trash2, Clock, GripVertical } from "lucide-react";
import {
  Place,
  PLACES,
} from "@/lib/mock-itinerary-data";
import { cn } from "@/lib/utils";

export type DayItem = {
  id: string;
  kind: "place" | "activity";
  title: string;
  placeId?: string;
  start: string;
  end: string;
  travelMinFromPrev?: number;
};

export function getPlace(id?: string): Place | undefined {
  return PLACES.find((p) => p.id_api_place === id);
}

export function min(t: string) { const [h,m]=t.split(":").map(Number); return h*60+m; }

export default function PlannerList({
  items, onChange, onRemove, onSelect, selectedId,
}: {
  items: DayItem[];
  onChange: (id: string, patch: Partial<DayItem>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  const sorted = [...items].sort((a,b)=>min(a.start)-min(b.start));

  return (
    <div className="space-y-3">
      {sorted.map((it) => {
        const place = getPlace(it.placeId);
        const active = selectedId === it.id;
        return (
          <div
            key={it.id}
            className={cn("rounded-xl border bg-white p-3 cursor-pointer", active ? "ring-2 ring-[var(--sp-primary)]" : "hover:border-[var(--sp-primary)]/50")}
            onClick={() => onSelect(it.id)}
          >
            <div className="flex items-start gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {it.kind === "place" ? (place?.nombre ?? it.title) : it.title}
                  </div>
                  <Button size="icon" variant="ghost" onClick={(e)=>{e.stopPropagation(); onRemove(it.id);}}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TimeRangePicker
                    start={it.start}
                    end={it.end}
                    onChange={(v) => onChange(it.id, v)}
                  />
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Duración: <b className="ml-1">{min(it.end) - min(it.start)} min</b>
                    {it.travelMinFromPrev ? <span className="ml-2">· Traslado prev.: <b>{it.travelMinFromPrev} min</b></span> : null}
                  </div>
                </div>
                {place && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline">{place.category}</Badge>
                    <Badge variant="outline">{place.state.toUpperCase()}</Badge>
                    <Badge variant="outline">⭐ {place.google_score}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Usa el mapa para buscar y pulsa “Añadir al día”. Aquí aparecerán tus actividades.
        </div>
      )}
    </div>
  );
}
