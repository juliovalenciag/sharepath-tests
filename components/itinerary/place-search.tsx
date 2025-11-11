"use client";

import * as React from "react";
import { getPlacesByStates, estimateTravelMin, findPlace, minToTime, timeToMin, clampEndIfNeeded } from "@/lib/itinerary-utils";
import { DayActivity, Place } from "@/lib/itinerary-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEdit } from "./edit-context";
import TimeRangePicker from "@/components/ui/time-range-picker";
import { Plus, MapPin } from "lucide-react";

function uid() { return "a_" + Math.random().toString(36).slice(2, 10); }

export default function PlaceSearch({ dayISO }: { dayISO: string }) {
  const { edit, addActivity } = useEdit();
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<Place | null>(null);
  const [time, setTime] = React.useState({ start: "10:00", end: "11:30" });

  const results = React.useMemo(() => {
    const base = getPlacesByStates(edit.states);
    const qs = q.trim().toLowerCase();
    if (!qs) return base.slice(0, 10).sort((a, b) => b.popularity - a.popularity);
    return base
      .filter((p) => p.name.toLowerCase().includes(qs) || p.tags?.some((t) => t.toLowerCase().includes(qs)))
      .slice(0, 20);
  }, [q, edit.states]);

  const lastOfDay = (edit.days[dayISO] ?? []).at(-1);
  const travelPreview = React.useMemo(() => {
    if (!selected) return null;
    if (!lastOfDay) return 0;
    const prevPlace = findPlace(lastOfDay.placeId);
    if (!prevPlace) return null;
    return estimateTravelMin(prevPlace, selected);
  }, [selected, lastOfDay]);

  function addSelected() {
    if (!selected) return;
    const fixedEnd = clampEndIfNeeded(time.start, time.end);
    const activity: DayActivity = {
      id: uid(),
      placeId: selected.id,
      start: time.start,
      end: fixedEnd,
      travelMinFromPrev: travelPreview ?? 0,
    };
    addActivity(dayISO, activity);
    setSelected(null);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Buscar / Sugerencias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej. museo, tacos, mirador, parque…"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`text-left rounded-xl border p-3 hover:border-[var(--sp-primary)] transition ${
                selected?.id === p.id ? "ring-2 ring-[var(--sp-primary)]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <Badge variant="outline">{p.state.toUpperCase()}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-1">
                {p.category.map((c) => (
                  <span key={c} className="rounded bg-[var(--sp-bg)] px-2 py-0.5">{c}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rounded-xl border p-3 space-y-3 bg-[var(--sp-bg)]">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selected.name}
              </div>
              <span className="text-xs text-muted-foreground">{selected.avgStayMin} min sugerido</span>
            </div>

            <TimeRangePicker
              start={time.start}
              end={time.end}
              onChange={(v) => setTime(v)}
            />

            <div className="text-xs text-muted-foreground">
              {typeof travelPreview === "number" && (
                <span>Traslado previo estimado: <b>{travelPreview} min</b></span>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={addSelected} className="bg-[var(--sp-primary)]">
                <Plus className="h-4 w-4 mr-2" /> Añadir al día
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
