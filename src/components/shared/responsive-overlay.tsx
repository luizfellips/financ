"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type ResponsiveOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Applied to DialogContent on desktop */
  desktopClassName?: string;
  /** Applied to SheetContent on mobile */
  mobileClassName?: string;
};

export function ResponsiveOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  desktopClassName,
  mobileClassName,
}: ResponsiveOverlayProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "flex h-[min(92dvh,100%)] flex-col gap-0 rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]",
            mobileClassName,
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
          <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(desktopClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
