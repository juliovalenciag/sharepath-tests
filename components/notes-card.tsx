'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Preferencias alimentarias (vegano, sin gluten).',
  'Evitar filas largas; comprar boletos anticipados.',
  'Traslados máximos de 90 min por día.',
  'Pet friendly.',
  'Silla de ruedas / accesibilidad.',
  'Preservar tiempo para fotografías al atardecer.',
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  maxChars?: number;
  className?: string;
};

export default function NotesCard({ value, onChange, maxChars = 300, className }: Props) {
  const len = value.trim().length;
  const over = len > maxChars;

  function appendSuggestion(s: string) {
    const text = value ? value.replace(/\s*$/, '') + (value.trim().endsWith('.') ? ' ' : '. ') + s : s;
    onChange(text);
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle>Notas</CardTitle>
        <CardDescription>
          ¿Qué debe saber el editor? (condiciones del grupo, restricciones, recordatorios)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={6}
          placeholder="Ej.: Viaje con 2 niños; priorizar actividades al aire libre. Reservar Museo Frida antes del viernes. Evitar tráfico 7–9 am."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="resize-y"
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer"
              onClick={() => appendSuggestion(s)}
              title="Agregar a notas"
            >
              {s}
            </Badge>
          ))}
        </div>
        <div
          className={cn(
            'text-xs text-right',
            over ? 'text-red-600' : 'text-muted-foreground'
          )}
        >
          {len}/{maxChars}
        </div>
      </CardContent>
    </Card>
  );
}
