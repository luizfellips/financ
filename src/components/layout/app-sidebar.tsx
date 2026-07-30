"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  FolderTree,
  Landmark,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/transacoes", label: "Transações", icon: Receipt },
  { href: "/receitas", label: "Receitas", icon: ArrowUpRight },
  { href: "/despesas", label: "Despesas", icon: ArrowDownLeft },
  { href: "/recorrencias", label: "Recorrências", icon: Repeat },
  { href: "/categorias", label: "Categorias", icon: FolderTree },
  { href: "/orcamentos", label: "Orçamentos", icon: Wallet },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: PiggyBank },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active
                  ? "text-sidebar-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
        <Wallet className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight">Financ</p>
        <p className="text-[11px] text-muted-foreground">Finanças pessoais</p>
      </div>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand />
      <Separator />
      <ScrollArea className="flex-1 py-3">
        <NavLinks onNavigate={onNavigate} />
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Controle suas finanças com clareza e calma.
        </p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navegação</SheetTitle>
          </SheetHeader>
          <SidebarBody onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:flex-col">
      <SidebarBody />
    </aside>
  );
}

export function MobileSidebarTrigger() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 md:hidden"
      aria-label="Abrir menu"
      onClick={() => setSidebarOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
