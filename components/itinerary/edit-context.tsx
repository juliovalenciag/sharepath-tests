"use client";

import * as React from "react";
import { ItineraryEditing, DayActivity } from "@/lib/itinerary-types";
import { persistDraft } from "@/lib/itinerary-utils";

type Ctx = {
  edit: ItineraryEditing;
  setEdit: React.Dispatch<React.SetStateAction<ItineraryEditing>>;
  addActivity: (dayISO: string, act: DayActivity) => void;
  removeActivity: (dayISO: string, actId: string) => void;
  moveActivity: (fromISO: string, toISO: string, actId: string, index?: number) => void;
  updateActivity: (dayISO: string, actId: string, patch: Partial<DayActivity>) => void;
};

export const EditCtx = React.createContext<Ctx | null>(null);

export function EditProvider({ initial, children }: { initial: ItineraryEditing; children: React.ReactNode }) {
  const [edit, setEdit] = React.useState<ItineraryEditing>(initial);

  // persistir en segundo plano
  React.useEffect(() => { persistDraft(edit); }, [edit]);

  const addActivity = (dayISO: string, act: DayActivity) =>
    setEdit((d) => ({
      ...d,
      days: { ...d.days, [dayISO]: [...(d.days[dayISO] ?? []), act] },
    }));

  const removeActivity = (dayISO: string, actId: string) =>
    setEdit((d) => ({
      ...d,
      days: { ...d.days, [dayISO]: (d.days[dayISO] ?? []).filter((a) => a.id !== actId) },
    }));

  const moveActivity = (fromISO: string, toISO: string, actId: string, index?: number) =>
    setEdit((d) => {
      const from = [...(d.days[fromISO] ?? [])];
      const item = from.find((a) => a.id === actId);
      if (!item) return d;
      const restFrom = from.filter((a) => a.id !== actId);
      const to = [...(d.days[toISO] ?? [])];
      if (index === undefined || index < 0 || index > to.length) to.push(item);
      else to.splice(index, 0, item);
      return { ...d, days: { ...d.days, [fromISO]: restFrom, [toISO]: to } };
    });

  const updateActivity = (dayISO: string, actId: string, patch: Partial<DayActivity>) =>
    setEdit((d) => ({
      ...d,
      days: {
        ...d.days,
        [dayISO]: (d.days[dayISO] ?? []).map((a) => (a.id === actId ? { ...a, ...patch } : a)),
      },
    }));

  return (
    <EditCtx.Provider value={{ edit, setEdit, addActivity, removeActivity, moveActivity, updateActivity }}>
      {children}
    </EditCtx.Provider>
  );
}

export function useEdit() {
  const ctx = React.useContext(EditCtx);
  if (!ctx) throw new Error("useEdit must be used within EditProvider");
  return ctx;
}
