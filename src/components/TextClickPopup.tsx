"use client";

import { CircularProgress, Divider, Grid, Typography } from "@mui/material";
import Popover from "@mui/material/Popover";
import React, { useCallback, useEffect, useRef, useState } from "react";

import type { Reading } from "@/app/hanja/middleChinese";

import { MiddleChinesePronInfo } from "./MiddleChinesePronInfo";

interface PopupState {
  char: string;
  anchorPosition: { top: number; left: number };
  lookup:
    | { status: "loading" }
    | { status: "success"; readings: Reading[] }
    | { status: "empty" }
    | { status: "error" };
}

interface CharacterAtPoint {
  char: string;
  rect: DOMRect;
}

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, [role="button"], [contenteditable="true"]';
const CLOSED_ANCHOR_POSITION = { top: 0, left: 0 };

function isPopupTarget(
  node: Node,
  container: Element,
  targetSelector?: string,
): boolean {
  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return Boolean(
    element &&
      container.contains(node) &&
      !element.closest(INTERACTIVE_SELECTOR) &&
      (!targetSelector || element.closest(targetSelector)),
  );
}

function getTextPositionAtPoint(
  x: number,
  y: number,
): { node: Text; offset: number } | null {
  if (typeof document.caretPositionFromPoint === "function") {
    const position = document.caretPositionFromPoint(x, y);
    if (position?.offsetNode.nodeType === Node.TEXT_NODE) {
      return { node: position.offsetNode as Text, offset: position.offset };
    }
  }

  if (typeof document.caretRangeFromPoint === "function") {
    const range = document.caretRangeFromPoint(x, y);
    if (range?.startContainer.nodeType === Node.TEXT_NODE) {
      return {
        node: range.startContainer as Text,
        offset: range.startOffset,
      };
    }
  }

  return null;
}

export function getCharacterAtPoint(
  x: number,
  y: number,
): CharacterAtPoint | null {
  const position = getTextPositionAtPoint(x, y);
  if (!position) return null;

  const text = position.node.data;
  const candidates: (CharacterAtPoint & { distance: number })[] = [];
  let start = 0;

  for (const char of text) {
    const end = start + char.length;
    if (start <= position.offset && position.offset <= end) {
      const range = document.createRange();
      range.setStart(position.node, start);
      range.setEnd(position.node, end);

      for (const rect of range.getClientRects()) {
        if (
          rect.left <= x &&
          x <= rect.right &&
          rect.top <= y &&
          y <= rect.bottom
        ) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          candidates.push({
            char,
            rect,
            distance: (centerX - x) ** 2 + (centerY - y) ** 2,
          });
        }
      }
    }
    if (start > position.offset) break;
    start = end;
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const candidate = candidates[0];
  if (!candidate || !/^\p{Script=Han}$/u.test(candidate.char)) return null;

  return candidate;
}

export function TextClickPopup({
  children,
  lookup,
  targetSelector,
}: {
  children: React.ReactNode;
  lookup: (char: string) => Promise<Reading[] | null>;
  targetSelector?: string;
}) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const handleClose = useCallback(() => {
    requestIdRef.current += 1;
    setPopup(null);
  }, []);

  const showCharacter = useCallback(
    ({ char, rect }: CharacterAtPoint) => {
      const requestId = ++requestIdRef.current;
      setPopup({
        char,
        anchorPosition: {
          top: rect.bottom + 5,
          left: rect.left + rect.width / 2,
        },
        lookup: { status: "loading" },
      });
      lookup(char)
        .then((readings) => {
          if (requestIdRef.current !== requestId) return;
          setPopup((current) => {
            if (!current || current.char !== char) return current;
            return {
              ...current,
              lookup:
                readings === null || readings.length === 0
                  ? { status: "empty" }
                  : { status: "success", readings },
            };
          });
        })
        .catch((error: unknown) => {
          if (requestIdRef.current !== requestId) return;
          console.error("Failed to load Middle Chinese data:", error);
          setPopup((current) => {
            if (!current || current.char !== char) return current;
            return { ...current, lookup: { status: "error" } };
          });
        });
    },
    [lookup],
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      const target = e.target;
      if (
        !container ||
        !(target instanceof Node) ||
        !isPopupTarget(target, container, targetSelector)
      ) {
        handleClose();
        return;
      }

      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        handleClose();
        return;
      }

      const result = getCharacterAtPoint(e.clientX, e.clientY);
      if (result) {
        showCharacter(result);
      } else {
        handleClose();
      }
    },
    [handleClose, showCharacter, targetSelector],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.key !== "Enter" ||
        e.defaultPrevented ||
        e.isComposing ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      const container = containerRef.current;
      const selection = window.getSelection();
      if (
        !container ||
        !selection ||
        selection.isCollapsed ||
        selection.rangeCount !== 1
      ) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (
        !isPopupTarget(range.startContainer, container, targetSelector) ||
        !isPopupTarget(range.endContainer, container, targetSelector)
      ) {
        return;
      }

      const char = selection.toString().trim();
      if (!/^\p{Script=Han}$/u.test(char)) return;

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      e.preventDefault();
      showCharacter({ char, rect });
    },
    [showCharacter, targetSelector],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      requestIdRef.current += 1;
      container.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClick, handleKeyDown]);

  return (
    <div ref={containerRef}>
      {children}
      <Popover
        open={Boolean(popup)}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={popup?.anchorPosition ?? CLOSED_ANCHOR_POSITION}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableAutoFocus
        disableEnforceFocus
        disableScrollLock
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#1a1a1a",
              color: "#fff",
              p: "6px 12px",
              borderRadius: 1.5,
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              overflow: "hidden",
              maxWidth: "300px",
            },
          },
        }}
      >
        {popup && (
          <div
            role="status"
            aria-atomic="true"
            aria-busy={popup.lookup.status === "loading"}
            aria-live="polite"
          >
            <Typography sx={{ fontSize: "150%" }}>{popup.char}</Typography>
            <Grid container spacing={1} alignItems="center">
              {popup.lookup.status === "success" &&
                popup.lookup.readings.map((reading, i) => (
                  <React.Fragment key={i}>
                    {i > 0 ? (
                      <Grid size={12}>
                        <Divider />
                      </Grid>
                    ) : null}
                    <Grid size={12}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid size={1}>{i + 1}</Grid>
                        <MiddleChinesePronInfo
                          reading={reading}
                          leftWidth={3}
                        />
                      </Grid>
                    </Grid>
                  </React.Fragment>
                ))}
              {popup.lookup.status === "loading" && (
                <CircularProgress
                  aria-label="중고음 자료 불러오는 중"
                  color="inherit"
                  size={24}
                />
              )}
              {popup.lookup.status === "empty" && (
                <Typography>중고음 자료가 없습니다.</Typography>
              )}
              {popup.lookup.status === "error" && (
                <Typography>중고음 자료를 불러오지 못했습니다.</Typography>
              )}
            </Grid>
          </div>
        )}
      </Popover>
    </div>
  );
}
