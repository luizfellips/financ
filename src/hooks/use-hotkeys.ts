"use client";

import * as React from "react";

type HotkeyHandler = (event: KeyboardEvent) => void;

type HotkeyOptions = {
  enabled?: boolean;
  preventDefault?: boolean;
};

function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey
    .toLowerCase()
    .split("+")
    .map((part) => part.trim());
  const key = parts[parts.length - 1];
  const needCtrl = parts.includes("ctrl") || parts.includes("mod");
  const needMeta = parts.includes("meta") || parts.includes("cmd");
  const needAlt = parts.includes("alt");
  const needShift = parts.includes("shift");

  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  if (needCtrl && !ctrlOrMeta) return false;
  if (needMeta && !event.metaKey) return false;
  if (needAlt !== event.altKey) return false;
  if (needShift !== event.shiftKey) return false;

  return event.key.toLowerCase() === key;
}

export function useHotkeys(
  hotkey: string,
  handler: HotkeyHandler,
  options: HotkeyOptions = {},
) {
  const { enabled = true, preventDefault = true } = options;
  const handlerRef = React.useRef(handler);

  React.useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  React.useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      if (isTyping && !hotkey.toLowerCase().includes("mod") && !hotkey.toLowerCase().includes("ctrl")) {
        return;
      }

      if (!matchesHotkey(event, hotkey)) return;
      if (preventDefault) event.preventDefault();
      handlerRef.current(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey, enabled, preventDefault]);
}
