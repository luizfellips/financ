"use client";

import * as LucideIcons from "lucide-react";
import { Archive, MoreHorizontal, Pencil, Plus, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AccountForm,
  type AccountFormValues,
} from "@/features/accounts/components/account-form";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
} from "@/hooks/use-accounts";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/models";
import { formatCurrency } from "@/utils/currency";

function AccountsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | null>(null);
  const [archiving, setArchiving] = React.useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

  React.useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/contas");
    }
  }, [searchParams, router]);

  async function handleSubmit(values: AccountFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditing(null);
  }

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance ?? account.initialBalance),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas"
        description="Cadastre contas e acompanhe o saldo atual de cada uma"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova conta
          </Button>
        }
      />

      {!isLoading && accounts.length > 0 ? (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">Saldo total</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {accounts.length}{" "}
              {accounts.length === 1 ? "conta ativa" : "contas ativas"}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta"
          description="Cadastre suas contas bancárias, carteiras e investimentos com o saldo atual."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova conta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const Icon =
              (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
                account.icon
              ] ?? LucideIcons.Wallet;
            const balance = account.balance ?? account.initialBalance;
            return (
              <Card key={account.id} className="group relative overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: account.color }}
                />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${account.color}22`,
                        color: account.color,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-1.5 text-base">
                        {account.name}
                        {account.isDefault ? (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ) : null}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {ACCOUNT_TYPE_LABELS[account.type]}
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
                          setEditing(account);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {!account.isDefault ? (
                        <DropdownMenuItem
                          onClick={() =>
                            void updateMutation.mutateAsync({
                              id: account.id,
                              isDefault: true,
                            })
                          }
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Definir como padrão
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setArchiving(account)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p
                    className={cn(
                      "text-2xl font-semibold tabular-nums tracking-tight",
                      balance < 0 && "text-destructive",
                    )}
                  >
                    {formatCurrency(balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saldo inicial: {formatCurrency(account.initialBalance)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar conta" : "Nova conta"}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            key={editing?.id ?? "new"}
            account={editing}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => !open && setArchiving(null)}
        title="Arquivar conta?"
        description="A conta deixará de aparecer nas listas e no dashboard. Transações existentes são preservadas."
        confirmLabel="Arquivar"
        variant="destructive"
        loading={updateMutation.isPending}
        onConfirm={async () => {
          if (!archiving) return;
          await updateMutation.mutateAsync({
            id: archiving.id,
            archived: true,
          });
          setArchiving(null);
        }}
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="list" rows={4} />}>
      <AccountsPageContent />
    </React.Suspense>
  );
}
