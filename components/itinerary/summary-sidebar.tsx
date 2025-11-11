"use client";

import * as React from "react";
import { useEdit } from "./edit-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function SummarySidebar({ onExport }: { onExport: () => void }) {
  const { edit } = useEdit();
  const dates = React.useMemo(() => {
    const out: string[] = [];
    const start = new Date(edit.startISO);
    const end = new Date(edit.endISO);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(new Date(d).toISOString().slice(0, 10));
    }
    return out;
  }, [edit.startISO, edit.endISO]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-[var(--sp-ink)]/90 px-4 py-2 text-white text-sm font-medium">Resumen</div>
        <div className="p-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Título</span><span className="font-medium max-w-[14ch] truncate">{edit.title}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Visibilidad</span><span className="font-medium">{edit.visibility}</span></div>
          <div><span className="text-muted-foreground">Estados</span>
            <div className="mt-1 flex flex-wrap gap-1.5">{edit.states.map((s) => (<Badge key={s} variant="outline">{s.toUpperCase()}</Badge>))}</div>
          </div>
          <div><span className="text-muted-foreground">Días</span>
            <div className="mt-1 text-xs text-muted-foreground">{dates.length} día(s)</div>
          </div>
        </div>
      </div>

      <Button onClick={onExport} className="w-full bg-[var(--sp-primary)]">
        <Download className="h-4 w-4 mr-2" /> Exportar JSON
      </Button>
    </div>
  );
}
