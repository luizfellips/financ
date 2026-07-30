"use client";

import * as LucideIcons from "lucide-react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { MobileFab } from "@/components/shared/mobile-fab";
import { PageHeader } from "@/components/shared/page-header";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/features/categories/components/category-form";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import type { Category, TransactionType } from "@/types/models";

function CategoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<"ALL" | TransactionType>("ALL");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState<Category | null>(null);

  const { data: categories = [], isLoading } = useCategories(
    tab === "ALL" ? undefined : tab,
  );
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  React.useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/categorias");
    }
  }, [searchParams, router]);

  async function handleSubmit(values: CategoryFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize receitas e despesas por categoria"
        actions={
          <Button
            className="hidden md:inline-flex"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full justify-start sm:w-auto">
            <TabsTrigger value="ALL">Todas</TabsTrigger>
            <TabsTrigger value="INCOME">Receitas</TabsTrigger>
            <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
            <TabsTrigger value="TRANSFER">Transferências</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {isLoading ? (
        <LoadingSkeleton variant="list" rows={6} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria"
          description="Crie categorias para classificar suas transações."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova categoria
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon =
              (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
                category.icon
              ] ?? LucideIcons.Tag;
            return (
              <Card key={category.id} className="group relative overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: category.color }}
                />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${category.color}22`,
                        color: category.color,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {TRANSACTION_TYPE_LABELS[category.type]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {!category.isSystem ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(category)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {category.isSystem ? (
                    <p className="text-xs text-muted-foreground">
                      Categoria do sistema
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Personalizada</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MobileFab
        label="Nova categoria"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />

      <ResponsiveOverlay
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar categoria" : "Nova categoria"}
      >
        <CategoryForm
          key={editing?.id ?? "new"}
          category={editing}
          defaultType={tab === "INCOME" ? "INCOME" : "EXPENSE"}
          onCancel={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </ResponsiveOverlay>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir categoria?"
        description="Transações vinculadas podem impedir a exclusão."
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="list" rows={6} />}>
      <CategoriesPageContent />
    </React.Suspense>
  );
}
