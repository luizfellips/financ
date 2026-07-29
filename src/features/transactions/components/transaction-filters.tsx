"use client";

import { Search, X } from "lucide-react";

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

export function TransactionFiltersBar({
  value,
  onChange,
  showTypeFilter = true,
}: TransactionFiltersBarProps) {
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

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
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
            <SelectTrigger>
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
          <SelectTrigger>
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
            patch({
              month: month === "all" ? undefined : Number(month),
            })
          }
        >
          <SelectTrigger>
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
            patch({
              year: year === "all" ? undefined : Number(year),
            })
          }
        >
          <SelectTrigger>
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
          <SelectTrigger>
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
          <SelectTrigger>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="number"
          step="0.01"
          placeholder="Valor mín."
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
        <div className="sm:col-span-2 lg:col-span-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <X className="mr-1 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
