"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useItinerary, safeParseISO } from "./editor-context";
import { PLACES } from "@/lib/mock-itinerary-data";

export default function Inspector() {
  const { activeDayISO, route, alerts, st } = useItinerary();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Inspector</CardTitle>
        <CardDescription>Ruta y tiempos del día</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {format(safeParseISO(activeDayISO), "EEE d 'de' MMMM yyyy", { locale: es })}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {route.coords.length} punto(s) · {route.totalKm} km aprox · {route.totalMin} min estimados
        </div>

        {alerts.hasIssue && (
          <Alert className="mt-3">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Traslados largos</AlertTitle>
            <AlertDescription className="text-xs">
              Distancia total: <b>{alerts.totals.totalKm} km</b> (~{alerts.totals.totalMin} min).
              {alerts.longLegs.length > 0 && (
                <> Tramos: {alerts.longLegs.map((l,i)=>
                  <span key={i}>[{l.from} → {l.to}: {l.km} km, {l.min} min] </span>
                )}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Mini timeline de tramos */}
        <div className="mt-3 space-y-2">
          {route.legs.map((leg, i) => (
            <div key={i} className="text-xs">
              <div className="font-medium">{leg.from.nombre} → {leg.to.nombre}</div>
              <div className="text-muted-foreground">{leg.km} km · {leg.min} min</div>
            </div>
          ))}
          {route.legs.length === 0 && (
            <div className="text-xs text-muted-foreground">
              Agrega 2 o más puntos para ver la ruta y tramos.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
