"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";

export interface KpiCardProps {
  title: string;
  value: number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  format?: "currency" | "number" | "percent";
  locale?: string;
  currency?: string;
  className?: string;
}

function AnimatedNumber({
  value,
  format = "currency",
  locale = "pt-BR",
  currency = "BRL",
}: {
  value: number;
  format?: "currency" | "number" | "percent";
  locale?: string;
  currency?: string;
}) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 80,
    damping: 20,
    mass: 0.8,
  });
  const [display, setDisplay] = React.useState(() => {
    if (format === "currency") return formatCurrency(0, locale, currency);
    if (format === "percent") return "0%";
    return "0";
  });

  React.useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  React.useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (format === "currency") {
        setDisplay(formatCurrency(latest, locale, currency));
        return;
      }
      if (format === "percent") {
        setDisplay(
          `${latest.toLocaleString(locale, { maximumFractionDigits: 1 })}%`,
        );
        return;
      }
      setDisplay(
        latest.toLocaleString(locale, {
          maximumFractionDigits: 0,
        }),
      );
    });
    return unsubscribe;
  }, [spring, format, locale, currency]);

  return <motion.span>{display}</motion.span>;
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  format = "currency",
  locale = "pt-BR",
  currency = "BRL",
  className,
}: KpiCardProps) {
  const trendPositive = (trend?.value ?? 0) >= 0;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">
          <AnimatedNumber
            value={value}
            format={format}
            locale={locale}
            currency={currency}
          />
        </div>
        {trend ? (
          <p
            className={cn(
              "mt-1 text-xs",
              trendPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {trendPositive ? "+" : ""}
            {trend.value.toLocaleString(locale, { maximumFractionDigits: 1 })}%
            {trend.label ? ` ${trend.label}` : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
