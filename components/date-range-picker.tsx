"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { addDays, differenceInCalendarDays } from "date-fns";
import type { DateRangeProps, Range } from "react-date-range";
import useMediaQuery from "@/components/use-media-query";
import clsx from "clsx";
import "./date-range-picker.css"; // 👈 estilos responsivos

const DateRangeComp = dynamic(
  () => import("react-date-range").then((m) => m.DateRange),
  { ssr: false }
) as unknown as React.ComponentType<DateRangeProps>;

export type DateRangeValue = { startDate: Date; endDate: Date };

type Props = {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  maxDays: number;
  className?: string;
};

export default function DateRangePicker({
  value,
  onChange,
  maxDays,
  className,
}: Props) {
  const isSmall = useMediaQuery("(max-width: 640px)");
  const monthsToShow = isSmall ? 1 : 2;

  const selection: Range = {
    startDate: value.startDate,
    endDate: value.endDate,
    key: "selection",
  };

  return (
    <div
      className={clsx("sp-rdr-wrapper rounded-xl border bg-white", className)}
    >
      <DateRangeComp
        ranges={[selection]}
        months={monthsToShow}
        direction={isSmall ? "vertical" : "horizontal"}
        moveRangeOnFirstSelection={false}
        rangeColors={["var(--sp-ink)"]}
        color="var(--sp-ink)"
        showDateDisplay={false}
        weekdayDisplayFormat="EEEEE"
        onChange={(r: { selection: Range }) => {
          let start = r.selection?.startDate ?? value.startDate;
          let end =
            r.selection?.endDate ?? r.selection?.startDate ?? value.endDate;
          const days = differenceInCalendarDays(end, start) + 1;
          if (days > maxDays) end = addDays(start, maxDays - 1);
          onChange({ startDate: start, endDate: end });
        }}
      />
    </div>
  );
}
