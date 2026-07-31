"use client";

import { Search, X } from "lucide-react";

import {
  MobileFilterToolbar,
  type MobileFilterChip,
} from "@/components/shared/mobile-filter-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { MONTH_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import type { TransactionFilters, TransactionType } from "@/types/models";
import { getCurrentMonthYear } from "@/utils/date";

type TransactionFiltersBarProps = {
  value: TransactionFilters;
  onChange: (next: TransactionFilters) => void;
  showTypeFilter?: boolean;
};

function useFilterHelpers(
  value: TransactionFilters,
  onChange: (next: TransactionFilters) => void,
  showTypeFilter: boolean,
) {
  const { year: currentYear } = getCurrentMonthYear();
  const { data: categories = [] } = useCategories(
    value.type && value.type !== "ALL"
      ? (value.type as TransactionType)
      : undefined,
  );

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  function patch(partial: Partial<TransactionFilters>) {
    onChange({ ...value, page: 1, ...partial });
  }

  function clear() {
    onChange({
      page: 1,
      pageSize: value.pageSize ?? 20,
      sortBy: "date",
      sortOrder: "desc",
      type: showTypeFilter ? "ALL" : value.type,
      search: "",
      recurring: "all",
    });
  }

  return { categories, years, patch, clear };
}

function SelectFilters({
  value,
  showTypeFilter,
  categories,
  years,
  patch,
  compact = false,
}: {
  value: TransactionFilters;
  showTypeFilter: boolean;
  categories: { id: string; name: string }[];
  years: number[];
  patch: (partial: Partial<TransactionFilters>) => void;
  compact?: boolean;
}) {
  const triggerClass = compact ? "h-10" : undefined;
  const currentYear = years[0];

  return (
    <>
      {showTypeFilter ? (
        <Select
          value={value.type ?? "ALL"}
          onValueChange={(type) =>
            patch({
              type: type as TransactionFilters["type"],
              categoryId: undefined,
            })
          }
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            {(Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {TRANSACTION_TYPE_LABELS[key]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={value.categoryId ?? "all"}
        onValueChange={(categoryId) =>
          patch({
            categoryId: categoryId === "all" ? undefined : categoryId,
          })
        }
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.month ? String(value.month) : "all"}
        onValueChange={(month) =>
          patch(
            month === "all"
              ? { month: undefined }
              : {
                  month: Number(month),
                  year: value.year ?? currentYear,
                },
          )
        }
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os meses</SelectItem>
          {MONTH_LABELS.map((label, index) => (
            <SelectItem key={label} value={String(index + 1)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.year ? String(value.year) : "all"}
        onValueChange={(year) =>
          patch(
            year === "all"
              ? { year: undefined, month: undefined }
              : { year: Number(year) },
          )
        }
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os anos</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.recurring ?? "all"}
        onValueChange={(recurring) =>
          patch({
            recurring: recurring as TransactionFilters["recurring"],
          })
        }
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Recorrência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="true">Recorrentes</SelectItem>
          <SelectItem value="false">Avulsas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={`${value.sortBy ?? "date"}:${value.sortOrder ?? "desc"}`}
        onValueChange={(raw) => {
          const [sortBy, sortOrder] = raw.split(":") as [
            string,
            "asc" | "desc",
          ];
          patch({ sortBy, sortOrder });
        }}
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date:desc">Data (mais recente)</SelectItem>
          <SelectItem value="date:asc">Data (mais antiga)</SelectItem>
          <SelectItem value="amount:desc">Valor (maior)</SelectItem>
          <SelectItem value="amount:asc">Valor (menor)</SelectItem>
          <SelectItem value="title:asc">Título (A–Z)</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

function AmountFilters({
  value,
  patch,
  clear,
  compact = false,
}: {
  value: TransactionFilters;
  patch: (partial: Partial<TransactionFilters>) => void;
  clear: () => void;
  compact?: boolean;
}) {
  const inputClass = compact ? "h-10" : undefined;

  return (
    <>
      <Input
        type="number"
        step="0.01"
        placeholder="Valor mín."
        className={inputClass}
        value={value.minAmount ?? ""}
        onChange={(event) =>
          patch({
            minAmount:
              event.target.value === ""
                ? undefined
                : Number(event.target.value),
          })
        }
      />
      <Input
        type="number"
        step="0.01"
        placeholder="Valor máx."
        className={inputClass}
        value={value.maxAmount ?? ""}
        onChange={(event) =>
          patch({
            maxAmount:
              event.target.value === ""
                ? undefined
                : Number(event.target.value),
          })
        }
      />
      <Button type="button" variant="ghost" size="sm" onClick={clear}>
        <X className="mr-1 h-4 w-4" />
        Limpar filtros
      </Button>
    </>
  );
}

function buildChips(
  value: TransactionFilters,
  showTypeFilter: boolean,
  categories: { id: string; name: string }[],
  patch: (partial: Partial<TransactionFilters>) => void,
): MobileFilterChip[] {
  const chips: MobileFilterChip[] = [];

  if (showTypeFilter && value.type && value.type !== "ALL") {
    chips.push({
      key: "type",
      label: TRANSACTION_TYPE_LABELS[value.type],
      onRemove: () => patch({ type: "ALL", categoryId: undefined }),
    });
  }

  if (value.categoryId) {
    const category = categories.find((c) => c.id === value.categoryId);
    chips.push({
      key: "category",
      label: category?.name ?? "Categoria",
      onRemove: () => patch({ categoryId: undefined }),
    });
  }

  if (value.month) {
    chips.push({
      key: "month",
      label: MONTH_LABELS[value.month - 1] ?? `Mês ${value.month}`,
      onRemove: () => patch({ month: undefined }),
    });
  }

  if (value.year) {
    chips.push({
      key: "year",
      label: String(value.year),
      onRemove: () => patch({ year: undefined, month: undefined }),
    });
  }

  if (value.recurring && value.recurring !== "all") {
    chips.push({
      key: "recurring",
      label: value.recurring === "true" ? "Recorrentes" : "Avulsas",
      onRemove: () => patch({ recurring: "all" }),
    });
  }

  if (value.minAmount != null) {
    chips.push({
      key: "minAmount",
      label: `Mín. ${value.minAmount}`,
      onRemove: () => patch({ minAmount: undefined }),
    });
  }

  if (value.maxAmount != null) {
    chips.push({
      key: "maxAmount",
      label: `Máx. ${value.maxAmount}`,
      onRemove: () => patch({ maxAmount: undefined }),
    });
  }

  return chips;
}

export function TransactionFiltersBar({
  value,
  onChange,
  showTypeFilter = true,
}: TransactionFiltersBarProps) {
  const { categories, years, patch, clear } = useFilterHelpers(
    value,
    onChange,
    showTypeFilter,
  );

  const chips = buildChips(value, showTypeFilter, categories, patch);
  const badgeCount = chips.length;

  return (
    <>
      <MobileFilterToolbar
        searchValue={value.search ?? ""}
        onSearchChange={(search) => patch({ search })}
        searchPlaceholder="Buscar por título..."
        badgeCount={badgeCount}
        chips={chips}
      >
        <SelectFilters
          value={value}
          showTypeFilter={showTypeFilter}
          categories={categories}
          years={years}
          patch={patch}
          compact
        />
        <AmountFilters value={value} patch={patch} clear={clear} compact />
      </MobileFilterToolbar>

      <div className="hidden space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título..."
            value={value.search ?? ""}
            onChange={(event) => patch({ search: event.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SelectFilters
            value={value}
            showTypeFilter={showTypeFilter}
            categories={categories}
            years={years}
            patch={patch}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AmountFilters value={value} patch={patch} clear={clear} />
        </div>
      </div>
    </>
  );
}
