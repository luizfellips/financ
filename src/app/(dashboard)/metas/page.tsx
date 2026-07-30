"use client";

import * as LucideIcons from "lucide-react";
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { MobileFab } from "@/components/shared/mobile-fab";
import { PageHeader } from "@/components/shared/page-header";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { StatProgress } from "@/components/shared/stat-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContributionForm,
  type ContributionFormValues,
} from "@/features/goals/components/contribution-form";
import {
  GoalForm,
  type GoalFormValues,
} from "@/features/goals/components/goal-form";
import {
  useContributeGoal,
  useCreateGoal,
  useDeleteContribution,
  useDeleteGoal,
  useGoals,
  useUpdateContribution,
  useUpdateGoal,
} from "@/hooks/use-goals";
import type { Goal, GoalContribution } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

function GoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [contributeOpen, setContributeOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [contributing, setContributing] = React.useState<Goal | null>(null);
  const [editingContribution, setEditingContribution] = React.useState<{
    goal: Goal;
    contribution: GoalContribution;
  } | null>(null);
  const [deleting, setDeleting] = React.useState<Goal | null>(null);
  const [deletingContribution, setDeletingContribution] = React.useState<{
    goal: Goal;
    contribution: GoalContribution;
  } | null>(null);

  const { data: goals = [], isLoading } = useGoals();
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();
  const contributeMutation = useContributeGoal();
  const updateContributionMutation = useUpdateContribution();
  const deleteContributionMutation = useDeleteContribution();

  React.useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/metas");
    }
  }, [searchParams, router]);

  async function handleSubmit(values: GoalFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleContribute(values: ContributionFormValues) {
    if (!contributing) return;
    await contributeMutation.mutateAsync({
      id: contributing.id,
      amount: values.amount,
      note: values.note,
      date: values.date,
    });
    setContributeOpen(false);
    setContributing(null);
  }

  async function handleUpdateContribution(values: ContributionFormValues) {
    if (!editingContribution) return;
    await updateContributionMutation.mutateAsync({
      goalId: editingContribution.goal.id,
      contributionId: editingContribution.contribution.id,
      amount: values.amount,
      note: values.note,
      date: values.date,
    });
    setEditingContribution(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas"
        description="Acompanhe objetivos e contribuições"
        actions={
          <Button
            className="hidden md:inline-flex"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova meta
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Nenhuma meta cadastrada"
          description="Defina um objetivo financeiro e acompanhe o progresso."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova meta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const Icon =
              (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
                goal.icon
              ] ?? LucideIcons.Target;
            const completed = Boolean(goal.completedAt);
            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${goal.color}22`,
                        color: goal.color,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {goal.name}
                        {completed ? (
                          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Concluída
                          </Badge>
                        ) : null}
                      </CardTitle>
                      <CardDescription>
                        Meta {formatCurrency(goal.targetAmount)}
                        {goal.deadline
                          ? ` · Prazo ${formatDate(goal.deadline)}`
                          : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!completed ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setContributing(goal);
                            setContributeOpen(true);
                          }}
                        >
                          <PiggyBank className="mr-2 h-4 w-4" />
                          Contribuir
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(goal);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleting(goal)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatProgress
                    label="Progresso"
                    current={goal.savedAmount}
                    target={goal.targetAmount}
                  />
                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <p>
                      Restante:{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatCurrency(goal.remaining)}
                      </span>
                    </p>
                    {goal.estimatedCompletion ? (
                      <p>
                        Conclusão estimada:{" "}
                        <span className="font-medium text-foreground">
                          {formatDate(goal.estimatedCompletion)}
                        </span>
                      </p>
                    ) : (
                      <p>Contribua regularmente para estimar a conclusão.</p>
                    )}
                    {goal.averageMonthlyContribution > 0 ? (
                      <p>
                        Média mensal:{" "}
                        {formatCurrency(goal.averageMonthlyContribution)}
                      </p>
                    ) : null}
                  </div>

                  {goal.contributions.length > 0 ? (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Contribuições ({goal.contributions.length})
                      </p>
                      <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                        {goal.contributions.map((contribution) => (
                          <li
                            key={contribution.id}
                            className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-2"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="text-sm font-medium tabular-nums">
                                  {formatCurrency(contribution.amount)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(contribution.date)}
                                </span>
                              </div>
                              {contribution.note ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {contribution.note}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="Editar contribuição"
                                onClick={() =>
                                  setEditingContribution({
                                    goal,
                                    contribution,
                                  })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                aria-label="Excluir contribuição"
                                onClick={() =>
                                  setDeletingContribution({
                                    goal,
                                    contribution,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {!completed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setContributing(goal);
                        setContributeOpen(true);
                      }}
                    >
                      <PiggyBank className="mr-1.5 h-4 w-4" />
                      Registrar contribuição
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MobileFab
        label="Nova meta"
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
        title={editing ? "Editar meta" : "Nova meta"}
      >
        <GoalForm
          key={editing?.id ?? "new"}
          goal={editing}
          onCancel={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={contributeOpen}
        onOpenChange={(open) => {
          setContributeOpen(open);
          if (!open) setContributing(null);
        }}
        title={
          contributing ? `Contribuir — ${contributing.name}` : "Contribuir"
        }
      >
        <ContributionForm
          key={contributing?.id ?? "contribute"}
          onCancel={() => {
            setContributeOpen(false);
            setContributing(null);
          }}
          onSubmit={handleContribute}
        />
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={Boolean(editingContribution)}
        onOpenChange={(open) => {
          if (!open) setEditingContribution(null);
        }}
        title={
          editingContribution
            ? `Editar contribuição — ${editingContribution.goal.name}`
            : "Editar contribuição"
        }
      >
        {editingContribution ? (
          <ContributionForm
            key={editingContribution.contribution.id}
            submitLabel="Salvar"
            defaultValues={{
              amount: editingContribution.contribution.amount,
              note: editingContribution.contribution.note,
              date: editingContribution.contribution.date,
            }}
            onCancel={() => setEditingContribution(null)}
            onSubmit={handleUpdateContribution}
          />
        ) : null}
      </ResponsiveOverlay>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir meta?"
        description="As contribuições registradas também serão removidas."
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingContribution)}
        onOpenChange={(open) => !open && setDeletingContribution(null)}
        title="Excluir contribuição?"
        description={
          deletingContribution
            ? `Remover ${formatCurrency(deletingContribution.contribution.amount)} de "${deletingContribution.goal.name}". O valor poupado será atualizado.`
            : undefined
        }
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleteContributionMutation.isPending}
        onConfirm={async () => {
          if (deletingContribution) {
            await deleteContributionMutation.mutateAsync({
              goalId: deletingContribution.goal.id,
              contributionId: deletingContribution.contribution.id,
            });
          }
          setDeletingContribution(null);
        }}
      />
    </div>
  );
}

export default function GoalsPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="list" rows={4} />}>
      <GoalsPageContent />
    </React.Suspense>
  );
}
