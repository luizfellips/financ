"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUiStore } from "@/stores/ui-store";

const NAV_COMMANDS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faturas", label: "Faturas", icon: CreditCard },
  { href: "/transacoes", label: "Transações", icon: Receipt },
  { href: "/receitas", label: "Receitas", icon: ArrowUpRight },
  { href: "/despesas", label: "Despesas", icon: ArrowDownLeft },
  { href: "/categorias", label: "Categorias", icon: FolderTree },
  { href: "/orcamentos", label: "Orçamentos", icon: Wallet },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: PiggyBank },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const CREATE_COMMANDS = [
  {
    href: "/transacoes?nova=1",
    label: "Nova transação",
    icon: Plus,
  },
  {
    href: "/receitas?nova=1",
    label: "Nova receita",
    icon: ArrowUpRight,
  },
  {
    href: "/despesas?nova=1",
    label: "Nova despesa",
    icon: ArrowDownLeft,
  },
  {
    href: "/categorias?nova=1",
    label: "Nova categoria",
    icon: FolderTree,
  },
  {
    href: "/orcamentos?nova=1",
    label: "Novo orçamento",
    icon: Wallet,
  },
  {
    href: "/metas?nova=1",
    label: "Nova meta",
    icon: Target,
  },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas ou ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {NAV_COMMANDS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => run(item.href)}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Criar rápido">
          {CREATE_COMMANDS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => run(item.href)}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
