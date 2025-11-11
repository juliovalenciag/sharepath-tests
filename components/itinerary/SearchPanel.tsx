"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Plus, TriangleAlert, ChevronDown } from "lucide-react";

import { PLACES, MX_STATES, Place, StateKey, popularActivitiesFor, centerForStates } from "@/lib/mock-itinerary-data";
import { suggestPlacesByRadius } from "@/lib/mock-itinerary-data";
import { estimateLegFromRef } from "@/lib/itinerary-algo";
import { useItinerary } from "./editor-context";

// ----- constantes UI/alertas -----
const KM_ALERT = 90;
const MIN_ALERT = 120;
type SortKey = "popular" | "distance" | "rating";
type TagKey = "styleTags" | "activityFilters";

export default function SearchPanel() {
  const { st, setSt, addPlace, activePlaceIds, daySuggestions } = useItinerary();

  // Punto de referencia: último del día o centro de estados
  const refPoint = useMemo<[number, number]>(() => {
    const last = activePlaceIds.at(-1);
    if (last) {
      const p = PLACES.find(pp => pp.id_api_place === last);
      if (p) return [p.latitud, p.longitud];
    }
    const c = centerForStates(st.states);
    return [c.lat, c.lng];
  }, [activePlaceIds, st.states]);

  // Filtros y derivados
  const [sortBy, setSortBy] = useState<SortKey>("popular");
  const [viewDense, setViewDense] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const activitiesFromStates = useMemo(() => popularActivitiesFor(st.states), [st.states]);

  const category = st.category && st.category !== "all" ? (st.category as Place["category"]) : undefined;
  const derivedQuery = useMemo(
    () => [st.q ?? "", (st.styleTags ?? []).join(" "), (st.activityFilters ?? []).join(" ")].join(" ").trim(),
    [st.q, st.styleTags, st.activityFilters]
  );

  // Resultados en estados seleccionados
  const baseResults = useMemo(
    () => suggestPlacesByRadius(st.states, st.radiusKm, derivedQuery, category),
    [st.states, st.radiusKm, derivedQuery, st.category]
  );
  const enrichedInState = useMemo(
    () => baseResults.map(p => {
      const { km, min } = estimateLegFromRef(refPoint, p);
      return { p, km, min, cross: false };
    }),
    [baseResults, refPoint]
  );

  // Descubrimiento en otros estados (con advertencias)
  const otherStateResults = useMemo(() => {
    const ql = derivedQuery.toLowerCase();
    const others = PLACES.filter(p => !st.states.includes(p.state)).filter(p => {
      if (category && p.category !== category) return false;
      if (ql) {
        const text = `${p.nombre} ${p.short_desc ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
        if (!text.includes(ql)) return false;
      }
      return true;
    });
    const enriched = others.map(p => {
      const { km, min } = estimateLegFromRef(refPoint, p);
      return { p, km, min, cross: true };
    });
    return enriched.sort((a, b) => b.p.total_reviews - a.p.total_reviews).slice(0, 16);
  }, [refPoint, st.states, derivedQuery, st.category]);

  // Orden + paginación
  const sortedInState = useMemo(() => {
    const arr = [...enrichedInState];
    if (sortBy === "popular") arr.sort((a, b) => b.p.total_reviews - a.p.total_reviews);
    if (sortBy === "rating")  arr.sort((a, b) => b.p.google_score - a.p.google_score);
    if (sortBy === "distance") arr.sort((a, b) => a.km - b.km);
    return arr;
  }, [enrichedInState, sortBy]);

  const paged = useMemo(() => sortedInState.slice(0, PAGE_SIZE * page), [sortedInState, page]);

  // ---- helpers ----
  const toggleTag = <K extends TagKey>(key: K, val: string) => {
    setSt(s => {
      const prev = (s[key] ?? []) as string[];
      const set = new Set(prev);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...s, [key]: Array.from(set) };
    });
  };

  const ResultCard = ({ p, km, min, cross }: { p: Place; km: number; min: number; cross: boolean }) => {
    const stateLabel = MX_STATES.find(s => s.key === p.state)?.label ?? p.state;
    const warning = cross || km >= KM_ALERT || min >= MIN_ALERT;
    return (
      <div className={`rounded-lg border p-2 flex items-start gap-3 ${viewDense ? "min-h-[72px]" : ""}`}>
        {p.foto_url && (
          <img src={p.foto_url} alt={p.nombre}
               className={`object-cover rounded-md border ${viewDense ? "h-14 w-18" : "h-16 w-20"}`} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium truncate">{p.nombre}</div>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                <Badge variant="outline">{p.category}</Badge>
                <span>★ {p.google_score.toFixed(1)}</span>
                <span>{km} km · {min} min</span>
                <span className="hidden sm:inline">{stateLabel}</span>
                {cross && <Badge variant="secondary">otro estado</Badge>}
              </div>
            </div>
            <Button size="sm" onClick={() => addPlace(p.id_api_place)}>
              <Plus className="h-4 w-4 mr-1" /> Añadir
            </Button>
          </div>
          {!viewDense && p.short_desc && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_desc}</p>
          )}
          {warning && (
            <div className="mt-1">
              <Alert className="py-1 px-2">
                <TriangleAlert className="h-3 w-3" />
                <AlertTitle className="text-[12px]">Traslado largo</AlertTitle>
                <AlertDescription className="text-[11px]">
                  Considera tiempos extra por distancia/estado. Evalúa moverlo a otro día o ajustar el radio.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-[78vh] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Búsqueda y Sugerencias
        </CardTitle>
        <CardDescription>Filtra y agrega; estima distancias/tiempos y detecta multi-estado.</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-3">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Buscar</Label>
            <Input placeholder="museo, tacos, mirador…" value={st.q ?? ""}
                   onChange={(e)=> setSt(s=>({ ...s, q: e.target.value }))}/>
          </div>
          <div>
            <Label>Categoría</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2"
                    value={st.category ?? "all"}
                    onChange={(e)=> setSt(s=>({ ...s, category: e.target.value as any }))}>
              {[
                "all","museo","parque","mirador","gastronomía","histórico","arte","avenida",
                "pueblo mágico","viñedo","religioso","mercado","zona arqueológica","fotopoint","cafetería","bar"
              ].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Radio (km)</Label>
            <div className="px-1">
              <Slider value={[st.radiusKm]} onValueChange={(v)=> setSt(s=>({ ...s, radiusKm: v[0]}))}
                      min={5} max={220} step={5}/>
              <div className="text-xs text-muted-foreground mt-1">{st.radiusKm} km</div>
            </div>
          </div>
        </div>

        {/* Estilo + Actividades con Scroll Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Estilo</Label>
            <ScrollArea className="mt-2 h-[72px] rounded-md border fade-scroll px-1">
              <div className="flex flex-wrap gap-2 p-2">
                {["romántico","familia","foodie","low-cost","premium","aventura","cultural"].map(t=>{
                  const on = (st.styleTags ?? []).includes(t);
                  return (
                    <button key={t} onClick={()=> toggleTag("styleTags", t)}
                            className={`text-sm rounded-full px-3 py-1 border ${on ? "bg-primary text-white" : "bg-background"}`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <div>
            <Label>Actividades</Label>
            <ScrollArea className="mt-2 h-[120px] rounded-md border fade-scroll px-1">
              <div className="flex flex-wrap gap-2 p-2">
                {activitiesFromStates.map(a => {
                  const on = (st.activityFilters ?? []).includes(a);
                  return (
                    <button key={a} onClick={()=> toggleTag("activityFilters", a)}
                            className={`text-sm rounded-full px-3 py-1 border ${on ? "bg-primary text-white" : "bg-background"}`}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Orden / vista */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Ordenar por:</span>
            <select className="rounded-md border px-2 py-1 text-xs"
                    value={sortBy} onChange={(e)=> setSortBy(e.target.value as SortKey)}>
              <option value="popular">popularidad</option>
              <option value="distance">distancia</option>
              <option value="rating">calificación</option>
            </select>
          </div>
          <button className="text-xs underline" onClick={()=> setViewDense(v=>!v)}>
            Vista {viewDense ? "detallada" : "compacta"}
          </button>
        </div>

        <Separator />

        {/* Sugerencias del día (con scroll) */}
        <div>
          <h4 className="text-sm font-medium mb-2">Sugerencias del día</h4>
          <ScrollArea className="h-[180px] rounded-md border fade-scroll px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
              {daySuggestions.map(s => {
                const { km, min } = estimateLegFromRef(refPoint, s.place);
                const cross = !st.states.includes(s.place.state);
                return <ResultCard key={s.place.id_api_place} p={s.place} km={km} min={min} cross={cross} />;
              })}
              {daySuggestions.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No hay sugerencias con la configuración actual.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Resultados en tus estados (scroll) */}
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-medium mb-2">Resultados</h4>
          <ScrollArea className="h-[28vh] rounded-md border fade-scroll px-1">
            <div className="space-y-2 p-2">
              {paged.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay resultados con los filtros actuales.</p>
              )}
              {paged.map(r => <ResultCard key={r.p.id_api_place} p={r.p} km={r.km} min={r.min} cross={false} />)}
              {paged.length < sortedInState.length && (
                <div className="flex justify-center py-2">
                  <Button variant="outline" size="sm" onClick={()=> setPage(p => p + 1)}>
                    Mostrar más <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Otros estados (scroll) */}
        {otherStateResults.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Explora en otros estados</h4>
              <ScrollArea className="h-[22vh] rounded-md border fade-scroll px-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                  {otherStateResults.map(r =>
                    <ResultCard key={r.p.id_api_place} p={r.p} km={r.km} min={r.min} cross />
                  )}
                </div>
              </ScrollArea>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <TriangleAlert className="h-3 w-3" /> Agregar lugares de otros estados puede extender
                significativamente los traslados del día.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
