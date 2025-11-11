"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  MX_STATES,
  osmEmbedForStates,
  MAX_DAYS,
} from "@/lib/mock-itinerary-data";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import { CalendarDays, MapPin, Lock, Users, Globe2 } from "lucide-react";

// Componentes
import DateRangePicker from "@/components/date-range-picker";
import StyleSelector, { ItineraryStyle } from "@/components/style-selector";

type StateKey = (typeof MX_STATES)[number]["key"];
type Visibility = "private" | "friends" | "public";

type GeneralDraft = {
  id: string;
  title: string;
  visibility: Visibility;
  style?: ItineraryStyle;
  states: StateKey[];
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
};

const uuid = () => "id_" + Math.random().toString(36).slice(2, 10);
const toISO = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
const fromISO = (iso: string) => new Date(`${iso}T00:00:00`);
const LS_PREFIX = "sharepath_draft_";

export default function NewItineraryPage() {
  const router = useRouter();
  const today = new Date();

  const [draft, setDraft] = useState<GeneralDraft>({
    id: uuid(),
    title: "",
    visibility: "private",
    style: undefined,
    states: ["cdmx"],
    startDate: toISO(today),
    endDate: toISO(today),
  });

  const [openAllStatesModal, setOpenAllStatesModal] = useState(false);

  const dateValue = useMemo(
    () => ({
      startDate: fromISO(draft.startDate),
      endDate: fromISO(draft.endDate),
    }),
    [draft.startDate, draft.endDate]
  );

  const daysCount = Math.max(
    1,
    Math.round(
      (fromISO(draft.endDate).getTime() - fromISO(draft.startDate).getTime()) /
        86400000
    ) + 1
  );

  const mapUrl = useMemo(
    () => osmEmbedForStates(draft.states, 11),
    [draft.states]
  );

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!draft.title.trim()) e.push("Indica un nombre para tu itinerario.");
    if (draft.states.length === 0) e.push("Selecciona al menos un estado.");
    return e;
  }, [draft.title, draft.states.length]);

  function toggleState(key: StateKey) {
    setDraft((d) => {
      const s = new Set(d.states);
      s.has(key) ? s.delete(key) : s.add(key);
      const arr = Array.from(s) as StateKey[];
      if (arr.length === MX_STATES.length) setOpenAllStatesModal(true);
      return { ...d, states: arr };
    });
  }

  function saveDraft() {
    localStorage.setItem(LS_PREFIX + draft.id, JSON.stringify(draft));
  }

  function continueToEdit() {
    saveDraft();
    router.push(`/itinerarios/editar/${draft.id}`);
  }

  const visibilityLabel =
    draft.visibility === "private"
      ? "Privado"
      : draft.visibility === "friends"
      ? "Amigos"
      : "Público";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 py-6 text-[var(--sp-ink)]">
      {/* Banda superior (color de marca) */}
      <div className="mb-6 rounded-2xl bg-[var(--sp-ink)] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Crear nuevo itinerario
            </h1>
            <p className="text-sm/6 opacity-80">
              Información general antes de personalizar tu ruta.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              saveDraft();
              alert("Borrador guardado localmente");
            }}
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            Guardar borrador
          </Button>
        </div>
      </div>

      {/* Grid principal */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!errors.length) continueToEdit();
        }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      >
        {/* Columna izquierda */}
        <div className="space-y-6 xl:col-span-2">
          {/* Información principal */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Información principal</CardTitle>
              <CardDescription>
                Nombre, visibilidad y preferencias generales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nombre del itinerario</Label>
                <Input
                  placeholder="Ej. Fin de semana cultural en CDMX"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-6">
                {/* Visibilidad */}
                <div className="space-y-2">
                  <Label>Visibilidad</Label>
                  <div className="grid grid-cols-3 gap-2 *:w-full">
                    <Button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, visibility: "private" }))
                      }
                      className={
                        draft.visibility === "private"
                          ? "bg-[var(--sp-primary)] text-white"
                          : "bg-[var(--sp-bg)] border"
                      }
                      variant={
                        draft.visibility === "private" ? "default" : "outline"
                      }
                    >
                      <Lock className="mr-1 h-4 w-3" /> Privado
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, visibility: "friends" }))
                      }
                      className={
                        draft.visibility === "friends"
                          ? "bg-[var(--sp-accent)] text-white"
                          : "bg-[var(--sp-bg)] border"
                      }
                      variant={
                        draft.visibility === "friends" ? "default" : "outline"
                      }
                    >
                      <Users className="mr-1 h-4 w-4" /> Amigos
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, visibility: "public" }))
                      }
                      className={
                        draft.visibility === "public"
                          ? "bg-[var(--sp-primary)] text-white"
                          : "bg-[var(--sp-bg)] border"
                      }
                      variant={
                        draft.visibility === "public" ? "default" : "outline"
                      }
                    >
                      <Globe2 className="mr-1 h-4 w-4" /> Público
                    </Button>
                  </div>
                </div>

                {/* Estilo compacto */}
                 <div className="space-y-2">
                  <Label>Estilo</Label>
                  <StyleSelector
                    value={draft.style}
                    onChange={(v) => setDraft((d) => ({ ...d, style: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Fechas</CardTitle>
              <CardDescription>
                Elige un rango; puedes navegar entre meses con libertad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-[var(--sp-bg)] px-3 py-1">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(fromISO(draft.startDate), "EEE d 'de' MMMM yyyy", {
                    locale: es,
                  })}
                </span>
                <span>→</span>
                <span className="inline-flex items-center rounded-full bg-[var(--sp-bg)] px-3 py-1">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(fromISO(draft.endDate), "EEE d 'de' MMMM yyyy", {
                    locale: es,
                  })}
                </span>
                <Separator
                  orientation="vertical"
                  className="hidden h-5 sm:block"
                />
                <span className="text-muted-foreground">
                  {daysCount} día(s)
                </span>
              </div>

              <DateRangePicker
                value={dateValue}
                maxDays={MAX_DAYS}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    startDate: toISO(v.startDate),
                    endDate: toISO(v.endDate),
                  }))
                }
                className="rounded-xl border p-2 bg-white"
              />
            </CardContent>
          </Card>

          {/* Estados */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Estados</CardTitle>
              <CardDescription>
                Selecciona entre CDMX, Edomex, Hidalgo, Morelos y Querétaro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {MX_STATES.map((s) => {
                  const active = draft.states.includes(s.key);
                  return (
                    <Button
                      key={s.key}
                      type="button"
                      onClick={() => toggleState(s.key)}
                      className={
                        active
                          ? "justify-start bg-[var(--sp-primary)] text-white"
                          : "justify-start bg-[var(--sp-bg)] border"
                      }
                      variant={active ? "default" : "outline"}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {s.label}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                En la siguiente pantalla agregarás lugares y horarios por día.
              </p>
            </CardContent>
          </Card>

          {/* Alertas */}
          {errors.length > 0 && (
            <Alert
              variant="default"
              className="border-red-300 bg-red-50 text-red-800"
            >
              <AlertTitle>Revisa lo siguiente</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-disc pl-5">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                saveDraft();
                alert("Borrador guardado localmente");
              }}
              className="w-full sm:w-auto"
            >
              Guardar borrador
            </Button>
            <Button
              type="submit"
              disabled={errors.length > 0}
              className="w-full sm:w-auto bg-[var(--sp-primary)] hover:brightness-95"
            >
              Continuar a personalización
            </Button>
          </div>
        </div>

        {/* Sidebar (sticky en xl). En móvil/tabla aparece debajo orden natural */}
        <aside className="space-y-6 xl:sticky xl:top-6 h-fit">
          {/* Resumen con encabezado en banda */}
          <Card className="shadow-sm overflow-hidden">
            <div className="bg-[var(--sp-ink)]/90 px-4 py-2 text-white">
              <span className="text-sm font-medium">Resumen</span>
            </div>
            <CardContent className="text-sm space-y-2 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibilidad</span>
                <span className="font-medium">{visibilityLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fechas</span>
                <span className="font-medium">
                  {format(fromISO(draft.startDate), "d MMM", { locale: es })} —{" "}
                  {format(fromISO(draft.endDate), "d MMM yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium">{daysCount} día(s)</span>
              </div>
              <div>
                <span className="text-muted-foreground">Estados</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {draft.states.map((k) => (
                    <Badge key={k} variant="outline">
                      {MX_STATES.find((s) => s.key === k)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapa */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Mapa</CardTitle>
              <CardDescription>
                Vista general según tus estados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  title="mapa"
                  src={mapUrl}
                  className="h-[220px] sm:h-[260px] md:h-[300px] w-full"
                  loading="lazy"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                La ubicación precisa se define en la siguiente etapa.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>

      {/* Modal: 5 estados */}
      <Dialog open={openAllStatesModal} onOpenChange={setOpenAllStatesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demasiados estados a la vez</DialogTitle>
            <DialogDescription>
              Considera los tiempos de traslado para aprovechar mejor cada día
              del viaje.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDraft((d) => ({
                  ...d,
                  states: d.states.slice(0, 1) as StateKey[],
                }));
                setOpenAllStatesModal(false);
              }}
            >
              Mantener solo el primero
            </Button>
            <Button onClick={() => setOpenAllStatesModal(false)}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
