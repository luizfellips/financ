"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type MobileFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type MobileFilterToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  badgeCount: number;
  chips: MobileFilterChip[];
  children: ReactNode;
  className?: string;
};

export function MobileFilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  badgeCount,
  chips,
  children,
  className,
}: MobileFilterToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-2 md:hidden", className)}>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            inputMode="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 rounded-full pl-9 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative size-11 shrink-0 rounded-full"
              aria-label="Filtros"
            >
              <SlidersHorizontal className="size-4" />
              {badgeCount > 0 ? (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px] leading-none"
                >
                  {badgeCount}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[min(70dvh,var(--radix-dropdown-menu-content-available-height))] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto p-3"
          >
            <div className="flex flex-col gap-3">{children}</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remover filtro ${chip.label}`}
                onClick={chip.onRemove}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
