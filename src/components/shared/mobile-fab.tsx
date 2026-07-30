"use client";

import { Plus } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MobileFabAction = {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
};

type MobileFabProps = {
  label?: string;
  onClick?: () => void;
  actions?: MobileFabAction[];
  className?: string;
  icon?: React.ReactNode;
};

export function MobileFab({
  label = "Criar",
  onClick,
  actions,
  className,
  icon,
}: MobileFabProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const buttonClass = cn(
    "size-14 rounded-full shadow-lg",
    className,
  );

  const content =
    actions && actions.length > 0 ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            className={buttonClass}
            aria-label={label}
          >
            {icon ?? <Plus className="size-6" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2 w-52">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onSelect}
              className="gap-2"
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button
        type="button"
        size="icon"
        className={buttonClass}
        aria-label={label}
        onClick={onClick}
      >
        {icon ?? <Plus className="size-6" />}
      </Button>
    );

  return createPortal(
    <div
      className="fixed right-5 z-50 md:hidden"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      {content}
    </div>,
    document.body,
  );
}
