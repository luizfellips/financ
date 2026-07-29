"use client";

import { Download, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";

import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  useBackup,
  useExportData,
  useImportData,
  useRestore,
  useSettings,
  useUpdateSettings,
} from "@/hooks/use-settings";
import type { ThemePreference } from "@/types/models";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const exportData = useExportData();
  const importData = useImportData();
  const backup = useBackup();
  const restore = useRestore();
  const { setTheme } = useTheme();

  const [exportFormat, setExportFormat] = React.useState<"csv" | "json">("csv");
  const [importEntity, setImportEntity] = React.useState("transactions");
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const restoreInputRef = React.useRef<HTMLInputElement>(null);

  async function patchSettings(
    partial: Parameters<typeof updateSettings.mutateAsync>[0],
  ) {
    const updated = await updateSettings.mutateAsync(partial);
    if (partial.theme) {
      const map: Record<ThemePreference, string> = {
        LIGHT: "light",
        DARK: "dark",
        SYSTEM: "system",
      };
      setTheme(map[updated.theme]);
    }
  }

  async function handleImportFile(file: File) {
    const content = await file.text();
    const format = file.name.endsWith(".json") ? "json" : "csv";
    await importData.mutateAsync({
      format,
      entity: importEntity,
      content,
    });
  }

  async function handleRestoreFile(file: File) {
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      await restore.mutateAsync(payload);
    } catch {
      toast.error("Arquivo de backup JSON inválido");
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações" description="Preferências da conta" />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Tema, notificações e dados da conta"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aparência</CardTitle>
            <CardDescription>Escolha o tema da interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) =>
                  void patchSettings({ theme: value as ThemePreference })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">Claro</SelectItem>
                  <SelectItem value="DARK">Escuro</SelectItem>
                  <SelectItem value="SYSTEM">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dia de início do mês</Label>
              <Select
                value={String(settings.monthStartDay)}
                onValueChange={(value) =>
                  void patchSettings({ monthStartDay: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificações</CardTitle>
            <CardDescription>
              Alertas de orçamento, metas e contas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Orçamentos</p>
                <p className="text-xs text-muted-foreground">
                  Avisar ao atingir o limite de alerta
                </p>
              </div>
              <Switch
                checked={settings.notifyBudget}
                onCheckedChange={(checked) =>
                  void patchSettings({ notifyBudget: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Metas</p>
                <p className="text-xs text-muted-foreground">
                  Avisar quando uma meta for concluída
                </p>
              </div>
              <Switch
                checked={settings.notifyGoals}
                onCheckedChange={(checked) =>
                  void patchSettings({ notifyGoals: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Contas a pagar</p>
                <p className="text-xs text-muted-foreground">
                  Lembretes de despesas recorrentes
                </p>
              </div>
              <Switch
                checked={settings.notifyBills}
                onCheckedChange={(checked) =>
                  void patchSettings({ notifyBills: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exportar / Importar</CardTitle>
            <CardDescription>
              Baixe seus dados ou importe um arquivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label>Formato de exportação</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) =>
                    setExportFormat(value as "csv" | "json")
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                disabled={exportData.isPending}
                onClick={() => exportData.mutate(exportFormat)}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Exportar
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Entidade para importação</Label>
                <Select value={importEntity} onValueChange={setImportEntity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactions">Transações</SelectItem>
                    <SelectItem value="categories">Categorias</SelectItem>
                    <SelectItem value="budgets">Orçamentos</SelectItem>
                    <SelectItem value="goals">Metas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImportFile(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="outline"
                disabled={importData.isPending}
                onClick={() => importInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Importar arquivo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backup e restauração</CardTitle>
            <CardDescription>
              Snapshot completo da sua conta em JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              disabled={backup.isPending}
              onClick={() => backup.mutate()}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Baixar backup
            </Button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleRestoreFile(file);
                event.target.value = "";
              }}
            />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Restaurar substitui ou mescla dados conforme o backup. Use com
                cuidado.
              </p>
              <Button
                variant="destructive"
                disabled={restore.isPending}
                onClick={() => restoreInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Restaurar backup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
