"use client";

import { LogOut, Search, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { MobileSidebarTrigger } from "@/components/layout/app-sidebar";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useUiStore } from "@/stores/ui-store";

function initials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "U";
}

export function AppTopbar() {
  const { data: session } = useSession();
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const toggleCommand = useUiStore((s) => s.toggleCommand);

  useHotkeys("mod+k", () => toggleCommand());

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <MobileSidebarTrigger />

      <Button
        variant="outline"
        className="h-9 flex-1 justify-start gap-2 text-muted-foreground sm:max-w-sm"
        onClick={() => setCommandOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar ou criar...</span>
        <span className="sm:hidden">Buscar...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          Ctrl K
        </kbd>
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsPopover />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {initials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
                {session?.user?.name ?? "Conta"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name ?? "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/configuracoes" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Configurações
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
