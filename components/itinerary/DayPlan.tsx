"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, GripVertical } from "lucide-react";
import { useItinerary, safeParseISO } from "./editor-context";
import { PLACES, MX_STATES } from "@/lib/mock-itinerary-data";

const DRAG_TYPE = "sharepath/day-slot";

export default function DayPlan() {
  const { st, setSt, days, activeDayISO, reorder, removePlace, moveToDay } = useItinerary();

  return (
    <Card className="h-[78vh] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Plan del día</CardTitle>
        <CardDescription>
          {format(safeParseISO(st.startDate), "d MMM", { locale: es })} —{" "}
          {format(safeParseISO(st.endDate), "d MMM yyyy", { locale: es })}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* tabs de días */}
        <div className="flex gap-2 overflow-auto pb-2">
          {days.map((d) => (
            <Button key={d} variant={d === activeDayISO ? "default" : "outline"}
              onClick={() => setSt(s => ({ ...s, activeDayISO: d }))} className="shrink-0">
              {format(safeParseISO(d), "EEE d MMM", { locale: es })}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-auto mt-1 space-y-3 pr-1"
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => { const from = Number(e.dataTransfer.getData(DRAG_TYPE) || "-1");
                               if (from >= 0) reorder(from, (st.byDay[activeDayISO] ?? []).length); }}>
          {(st.byDay[activeDayISO] ?? []).map((slot, idx) => {
            const place = PLACES.find(p => p.id_api_place === slot.placeId);
            return (
              <div key={idx} className="rounded-xl border p-3 bg-background"
                   draggable
                   onDragStart={(e)=>{ e.dataTransfer.setData(DRAG_TYPE, String(idx)); e.dataTransfer.effectAllowed="move";}}
                   onDragOver={(e)=>e.preventDefault()}
                   onDrop={(e)=>{ e.preventDefault(); const from = Number(e.dataTransfer.getData(DRAG_TYPE) || "-1");
                                  if (from >=0 && from!==idx) reorder(from, idx);}}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <GripVertical className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{place?.nombre ?? "Lugar"}</div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                        {place?.category && <Badge variant="outline">{place.category}</Badge>}
                        {place && <span>★ {place.google_score.toFixed(1)}</span>}
                        {place && <span className="hidden sm:inline">
                          {MX_STATES.find(s => s.key === place.state)?.label}
                        </span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <select className="text-sm border rounded-md px-2 py-1"
                      value={activeDayISO}
                      onChange={(e)=> moveToDay(idx, e.target.value)}>
                      <option value={activeDayISO}>Mover a…</option>
                      {days.filter(d=>d!==activeDayISO).map(d =>
                        <option key={d} value={d}>
                          {format(safeParseISO(d), "EEE d MMM", { locale: es })}
                        </option>
                      )}
                    </select>
                    <Button size="icon" variant="ghost" onClick={()=>removePlace(idx)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                  <div>
                    <Label>Inicio</Label>
                    <Input type="time" value={slot.start}
                      onChange={(e)=> setSt(s=>{
                        const list=[...(s.byDay[activeDayISO]??[])];
                        list[idx]={...list[idx], start:e.target.value};
                        return { ...s, byDay:{...s.byDay, [activeDayISO]:list}};
                      })}/>
                  </div>
                  <div>
                    <Label>Fin</Label>
                    <Input type="time" value={slot.end}
                      onChange={(e)=> setSt(s=>{
                        const list=[...(s.byDay[activeDayISO]??[])];
                        list[idx]={...list[idx], end:e.target.value};
                        return { ...s, byDay:{...s.byDay, [activeDayISO]:list}};
                      })}/>
                  </div>
                  <div className="col-span-2">
                    <Label>Nota</Label>
                    <Input placeholder="Tickets, recordatorios…" value={slot.note ?? ""}
                      onChange={(e)=> setSt(s=>{
                        const list=[...(s.byDay[activeDayISO]??[])];
                        list[idx]={...list[idx], note:e.target.value};
                        return { ...s, byDay:{...s.byDay, [activeDayISO]:list}};
                      })}/>
                  </div>
                </div>
              </div>
            );
          })}
          {(st.byDay[activeDayISO] ?? []).length === 0 && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              Aún no hay actividades para este día. Usa la columna central para agregar lugares y sugerencias.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
