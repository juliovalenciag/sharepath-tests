"use client";

import * as React from "react";
import { useEdit } from "./edit-context";
import { findPlace, hasOverlap, minToTime, timeToMin } from "@/lib/itinerary-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Clock } from "lucide-react";
import { DayActivity } from "@/lib/itinerary-types";
import TimeRangePicker from "@/components/ui/time-range-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function fmt(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
}

export default function DayColumn({ dayISO, index }: { dayISO: string; index: number }) {
  const { edit, removeActivity, moveActivity, updateActivity } = useEdit();
  const list = edit.days[dayISO] ?? [];
  const overlap = hasOverlap(list);

  // Drag & drop nativo (simple)
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, from: dayISO }));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain")) as { id: string; from: string };
    if (!data?.id) return;
    moveActivity(data.from, dayISO, data.id);
  };

  return (
    <div
      className="rounded-2xl border p-3 bg-white min-h-[260px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold">{fmt(dayISO)}</div>
        {overlap && <Badge variant="destructive">Conflictos</Badge>}
      </div>

      <div className="space-y-3">
        {list.map((a) => {
          const place = findPlace(a.placeId);
          return (
            <Card
              key={a.id}
              className="p-3 cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => onDragStart(e, a.id)}
              title={place?.name}
            >
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{place?.name ?? "Lugar"}</div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeActivity(dayISO, a.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TimeRangePicker
                      start={a.start}
                      end={a.end}
                      onChange={(v) => {
                        const endFixed = v.end;
                        updateActivity(dayISO, a.id, { start: v.start, end: endFixed });
                      }}
                    />
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Duración: <b className="ml-1">{timeToMin(a.end) - timeToMin(a.start)} min</b>
                      {a.travelMinFromPrev ? (
                        <span className="ml-2">· Traslado prev.: <b>{a.travelMinFromPrev} min</b></span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {list.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Arrastra aquí lugares o usa “Añadir al día” desde la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}
