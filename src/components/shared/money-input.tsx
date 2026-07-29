"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrencyInput } from "@/utils/currency";

export interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  locale?: string;
  currency?: string;
}

function formatDisplay(
  value: number | null | undefined,
  locale: string,
  currency: string,
): string {
  if (value == null || Number.isNaN(value)) return "";
  return formatCurrency(value, locale, currency);
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onValueChange,
      locale = "pt-BR",
      currency = "BRL",
      className,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [raw, setRaw] = React.useState(() =>
      formatDisplay(value, locale, currency),
    );

    React.useEffect(() => {
      if (!focused) {
        setRaw(formatDisplay(value, locale, currency));
      }
    }, [value, locale, currency, focused]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn("tabular-nums", className)}
        value={raw}
        onFocus={(event) => {
          setFocused(true);
          if (value != null && !Number.isNaN(value)) {
            setRaw(
              value.toLocaleString(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            );
          }
          onFocus?.(event);
        }}
        onChange={(event) => {
          const next = event.target.value;
          setRaw(next);
          onValueChange(parseCurrencyInput(next));
        }}
        onBlur={(event) => {
          setFocused(false);
          const parsed = parseCurrencyInput(event.target.value);
          onValueChange(parsed);
          setRaw(formatDisplay(parsed, locale, currency));
          onBlur?.(event);
        }}
        {...props}
      />
    );
  },
);
MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
