// types/react-date-range.d.ts
declare module "react-date-range" {
  import * as React from "react";

  export type Range = {
    startDate: Date;
    endDate: Date;
    key?: string;
  };

  export type DateRangeProps = {
    ranges: Range[];
    onChange: (item: { selection: Range }) => void;
    months?: number;
    direction?: "horizontal" | "vertical";
    moveRangeOnFirstSelection?: boolean;
    rangeColors?: string[];
    color?: string;
    showDateDisplay?: boolean;
    weekdayDisplayFormat?: string;
    shownDate?: Date;
    minDate?: Date;
    maxDate?: Date;
  };

  export class DateRange extends React.Component<DateRangeProps> {}
}
