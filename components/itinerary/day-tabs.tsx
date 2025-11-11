"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

export default function DayTabs({
  days,
  active,
  onChange,
}: {
  days: string[];
  active: string;
  onChange: (d: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d, i) => (
        <Button
          key={d}
          onClick={() => onChange(d)}
          variant={active === d ? "default" : "outline"}
          className={
            active === d ? "bg-[var(--sp-ink)] text-white" : "bg-white"
          }
        >
          Día {i + 1} ·{" "}
          {new Date(d).toLocaleDateString("es-MX", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </Button>
      ))}
    </div>
  );
}
