"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { start: string; end: string; onChange: (v: { start: string; end: string }) => void; stepMin?: number };

const buildTimes = (step=30) => {
  const out:string[]=[]; for (let m=8*60;m<=22*60;m+=step){const h=Math.floor(m/60),mm=m%60; out.push(`${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);} return out;
};
const OPTIONS = buildTimes();

export default function TimeRangePicker({ start, end, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Inicio</Label>
        <Select value={start} onValueChange={(v) => onChange({ start: v, end })}>
          <SelectTrigger><SelectValue placeholder="Inicio" /></SelectTrigger>
          <SelectContent className="max-h-64">{OPTIONS.map((t)=>(<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Fin</Label>
        <Select value={end} onValueChange={(v) => onChange({ start, end: v })}>
          <SelectTrigger><SelectValue placeholder="Fin" /></SelectTrigger>
          <SelectContent className="max-h-64">{OPTIONS.map((t)=>(<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
