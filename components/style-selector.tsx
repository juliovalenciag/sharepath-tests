'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Landmark,
  Users,
  UtensilsCrossed,
  Heart,
  Camera,
} from 'lucide-react';

export type ItineraryStyle =
  | 'cultural'
  | 'familiar'
  | 'gastronómico'
  | 'romántico'
  | 'fotografía';

export const STYLE_OPTIONS: {
  key: ItineraryStyle;
  label: string;
  Icon: React.ComponentType<any>;
}[] = [
  { key: 'cultural',      label: 'Cultural',      Icon: Landmark },
  { key: 'familiar',      label: 'Familiar',      Icon: Users },
  { key: 'gastronómico',  label: 'Gastronómico',  Icon: UtensilsCrossed },
  { key: 'romántico',     label: 'Romántico',     Icon: Heart },
  { key: 'fotografía',    label: 'Fotografía',    Icon: Camera },
];

type Props = {
  value?: ItineraryStyle;
  onChange: (v?: ItineraryStyle) => void;
  className?: string;
};

export default function StyleSelector({ value, onChange, className }: Props) {
  return (
    <div
      className={cn('grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5', className)}
      role="radiogroup"
      aria-label="Estilo del itinerario"
    >
      {STYLE_OPTIONS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? undefined : key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(active ? undefined : key);
              }
            }}
            className="text-left focus:outline-none"
          >
            <Card
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-3 text-lg transition-all pl-9 pr-9',
                active
                  ? 'border-[var(--sp-primary)] ring-2 ring-[var(--sp-primary)]'
                  : 'hover:border-[var(--sp-primary)]/50'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-full',
                  active ? 'bg-[var(--sp-primary)] text-white' : 'bg-[var(--sp-bg)] text-[var(--sp-ink)]'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className=" text-xs">{label}</span>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
