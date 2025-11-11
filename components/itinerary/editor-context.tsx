"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { eachDayOfInterval } from "date-fns";
import { Place, StateKey, PLACES } from "@/lib/mock-itinerary-data";
import {
  buildDayRoute,
  suggestForDay,
  logisticsAlerts,
} from "@/lib/itinerary-algo";
import { safeStorage } from "@/lib/safe-storage";

export type DaySlot = {
  placeId: string;
  start: string;
  end: string;
  note?: string;
};
export type EditState = {
  id: string;
  title: string;
  states: StateKey[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  activeDayISO?: string;
  byDay: Record<string, DaySlot[]>;
  radiusKm: number;
  q?: string;
  category?: Place["category"] | "all";
  styleTags?: string[];
  activityFilters?: string[];
};



const toISO = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

export function safeParseISO(iso?: string) {
  if (!iso) return new Date();
  const s = iso.includes("T") ? iso : `${iso}T00:00:00`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}
function daysInRange(startISO?: string, endISO?: string) {
  const start = safeParseISO(startISO);
  const end0 = safeParseISO(endISO);
  const end = end0 < start ? start : end0;
  return eachDayOfInterval({ start, end }).map(toISO);
}

type Ctx = {
  st: EditState;
  setSt: React.Dispatch<React.SetStateAction<EditState>>;
  days: string[];
  activeDayISO: string;
  activePlaceIds: string[];
  addPlace: (placeId: string) => void;
  removePlace: (index: number) => void;
  reorder: (from: number, to: number) => void;
  moveToDay: (from: number, dayISO: string) => void;
  // derivados útiles
  route: ReturnType<typeof buildDayRoute>;
  alerts: ReturnType<typeof logisticsAlerts>;
  daySuggestions: ReturnType<typeof suggestForDay>;
};

const ItineraryCtx = createContext<Ctx | null>(null);
export const useItinerary = () => {
  const c = useContext(ItineraryCtx);
  if (!c) throw new Error("useItinerary must be used inside ItineraryProvider");
  return c;
};

const KEY = (id: string) => `sp_edit_${id}`;

export function ItineraryProvider({
  initial,
  children,
}: {
  initial: EditState;
  children: React.ReactNode;
}) {
  const [st, setSt] = useState<EditState>(initial);

  // autosave
  useEffect(() => {
    const t = setTimeout(
      () => safeStorage.set(KEY(st.id), JSON.stringify(st)),
      350
    );
    return () => clearTimeout(t);
  }, [st]);

  const days = useMemo(
    () => daysInRange(st.startDate, st.endDate),
    [st.startDate, st.endDate]
  );
  const activeDayISO = useMemo(
    () => st.activeDayISO ?? days[0] ?? toISO(new Date()),
    [st.activeDayISO, days]
  );
  const activePlaceIds = useMemo(
    () => (st.byDay[activeDayISO] ?? []).map((s) => s.placeId),
    [st.byDay, activeDayISO]
  );

  const addPlace = (placeId: string) =>
    setSt((s) => {
      const list = s.byDay[activeDayISO] ?? [];
      return {
        ...s,
        byDay: {
          ...s.byDay,
          [activeDayISO]: [...list, { placeId, start: "10:00", end: "11:30" }],
        },
      };
    });
  const removePlace = (index: number) =>
    setSt((s) => {
      const list = (s.byDay[activeDayISO] ?? []).filter((_, i) => i !== index);
      return { ...s, byDay: { ...s.byDay, [activeDayISO]: list } };
    });
  const reorder = (from: number, to: number) =>
    setSt((s) => {
      const list = [...(s.byDay[activeDayISO] ?? [])];
      const [m] = list.splice(from, 1);
      list.splice(to, 0, m);
      return { ...s, byDay: { ...s.byDay, [activeDayISO]: list } };
    });
  const moveToDay = (from: number, dayISO: string) =>
    setSt((s) => {
      const src = [...(s.byDay[activeDayISO] ?? [])];
      const [m] = src.splice(from, 1);
      const dst = s.byDay[dayISO] ? [...s.byDay[dayISO]] : [];
      dst.push(m);
      return {
        ...s,
        byDay: { ...s.byDay, [activeDayISO]: src, [dayISO]: dst },
      };
    });

  const route = useMemo(() => buildDayRoute(activePlaceIds), [activePlaceIds]);
  const alerts = useMemo(
    () => logisticsAlerts(activePlaceIds),
    [activePlaceIds]
  );

  const daySuggestions = useMemo(
    () =>
      suggestForDay({
        dayPlaceIds: activePlaceIds,
        states: st.states,
        radiusKm: st.radiusKm,
        q: st.q,
        category: st.category === "all" ? undefined : st.category,
        styleTags: st.styleTags ?? [],
        limit: 12,
      }),
    [activePlaceIds, st.states, st.radiusKm, st.q, st.category, st.styleTags]
  );

  const value: Ctx = {
    st,
    setSt,
    days,
    activeDayISO,
    activePlaceIds,
    addPlace,
    removePlace,
    reorder,
    moveToDay,
    route,
    alerts,
    daySuggestions,
  };
  return (
    <ItineraryCtx.Provider value={value}>{children}</ItineraryCtx.Provider>
  );
}
