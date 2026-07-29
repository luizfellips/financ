"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_LABELS } from "@/lib/labels";
import { getCurrentMonthYear } from "@/utils/date";

export type MonthYearValue = {
  month: number;
  year: number;
};

type MonthYearPickerProps = {
  value: MonthYearValue;
  onChange: (next: MonthYearValue) => void;
  /** Years before current (default 4) and after (default 1). */
  yearsBefore?: number;
  yearsAfter?: number;
};

function shiftMonth(
  { month, year }: MonthYearValue,
  delta: number,
): MonthYearValue {
  const date = new Date(year, month - 1 + delta, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

export function MonthYearPicker({
  value,
  onChange,
  yearsBefore = 4,
  yearsAfter = 1,
}: MonthYearPickerProps) {
  const { year: currentYear } = getCurrentMonthYear();
  const yearStart = Math.min(currentYear - yearsBefore, value.year);
  const yearEnd = Math.max(currentYear + yearsAfter, value.year);
  const years = Array.from(
    { length: yearEnd - yearStart + 1 },
    (_, i) => yearStart + i,
  );

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Mês anterior"
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select
        value={String(value.month)}
        onValueChange={(month) =>
          onChange({ ...value, month: Number(month) })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_LABELS.map((label, index) => (
            <SelectItem key={label} value={String(index + 1)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(value.year)}
        onValueChange={(year) => onChange({ ...value, year: Number(year) })}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Próximo mês"
        onClick={() => onChange(shiftMonth(value, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
