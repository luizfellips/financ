"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  extractMoneyDigits,
  formatCurrency,
  parseMoneyDigits,
} from "@/utils/currency";

export interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  locale?: string;
  currency?: string;
  /** Allow toggling sign with "-" (useful for balances). Default false. */
  allowNegative?: boolean;
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
      allowNegative = false,
      className,
      onBlur,
      onFocus,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [raw, setRaw] = React.useState(() =>
      formatDisplay(value, locale, currency),
    );
    const negativeRef = React.useRef((value ?? 0) < 0);

    React.useEffect(() => {
      negativeRef.current = (value ?? 0) < 0;
      if (!focused) {
        setRaw(formatDisplay(value, locale, currency));
      }
    }, [value, locale, currency, focused]);

    function commitDigits(digits: string, negative: boolean) {
      const amount = parseMoneyDigits(digits, { negative });
      negativeRef.current = amount < 0;
      setRaw(digits ? formatCurrency(amount, locale, currency) : "");
      onValueChange(amount);
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={formatCurrency(0, locale, currency)}
        className={cn("tabular-nums", className)}
        value={raw}
        onFocus={(event) => {
          setFocused(true);
          negativeRef.current = (value ?? 0) < 0;
          onFocus?.(event);
        }}
        onKeyDown={(event) => {
          if (allowNegative && (event.key === "-" || event.key === "−")) {
            event.preventDefault();
            const current = value ?? 0;
            const next = -current;
            negativeRef.current = next < 0;
            onValueChange(next);
            setRaw(
              next === 0 && !extractMoneyDigits(raw)
                ? ""
                : formatCurrency(next, locale, currency),
            );
          }
          onKeyDown?.(event);
        }}
        onChange={(event) => {
          const digits = extractMoneyDigits(event.target.value);
          commitDigits(digits, allowNegative && negativeRef.current);
        }}
        onBlur={(event) => {
          setFocused(false);
          const amount = parseMoneyDigits(extractMoneyDigits(raw), {
            negative: allowNegative && negativeRef.current,
          });
          onValueChange(amount);
          setRaw(formatDisplay(amount, locale, currency));
          onBlur?.(event);
        }}
        {...props}
      />
    );
  },
);
MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
