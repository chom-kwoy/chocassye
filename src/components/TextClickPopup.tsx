"use client";

import { CircularProgress, Divider, Grid, Typography } from "@mui/material";
import Popover from "@mui/material/Popover";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Reading, getMCData } from "@/app/hanja/middleChinese";
import { MiddleChinesePronInfo } from "@/app/hanja/page";

interface PopupState {
  word: string;
  anchorPosition: { top: number; left: number };
  lookup:
    | { status: "loading" }
    | { status: "success"; readings: Reading[] }
    | { status: "empty" }
    | { status: "error" };
}

function getWordAtPoint(
  x: number,
  y: number,
): { word: string; pos: { x: number; y: number } | null } | null {
  let pos = document.caretPositionFromPoint(x, y);
  if (!pos) return null;

  let node = pos.offsetNode;
  if (node.nodeType !== Node.TEXT_NODE) return null;

  if (node.parentElement !== null) {
    const computedStyle = window.getComputedStyle(node.parentElement, null);
    const fontSize = computedStyle.getPropertyValue("font-size");
    const fontSizeInPixels = parseFloat(fontSize);

    const newPos = document.caretPositionFromPoint(
      x - fontSizeInPixels * 0.3,
      y,
    );
    if (newPos) {
      const newNode = newPos.offsetNode;
      if (newNode.nodeType === Node.TEXT_NODE) {
        node = newNode;
        pos = newPos;
      }
    }
  }

  const text = node.textContent ?? "";
  const offset = Math.min(pos.offset, text.length - 1);

  const match = text.slice(offset).match(/\p{Script=Han}/u);
  if (match === null) {
    return null;
  }

  const rect = pos.getClientRect();
  return {
    word: match[0],
    pos: rect ? { x: rect.left + rect.width / 2, y: rect.bottom } : null,
  };
}

export function TextClickPopup({ children }: { children: React.ReactNode }) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const handleClick = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      requestIdRef.current += 1;
      setPopup(null);
      return;
    }

    const result = getWordAtPoint(e.clientX, e.clientY);
    if (result) {
      const { word, pos } = result;
      const requestId = ++requestIdRef.current;
      setPopup({
        word,
        anchorPosition: {
          top: (pos?.y ?? e.clientY) + 5,
          left: pos?.x ?? e.clientX,
        },
        lookup: { status: "loading" },
      });
      getMCData(word)
        .then((readings) => {
          if (requestIdRef.current !== requestId) return;
          setPopup((current) => {
            if (!current || current.word !== word) return current;
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
            if (!current || current.word !== word) return current;
            return { ...current, lookup: { status: "error" } };
          });
        });
    } else {
      requestIdRef.current += 1;
      setPopup(null);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("click", handleClick);
    return () => {
      requestIdRef.current += 1;
      container.removeEventListener("click", handleClick);
    };
  }, [handleClick]);

  const handleClose = useCallback(() => {
    requestIdRef.current += 1;
    setPopup(null);
  }, []);

  return (
    <div ref={containerRef}>
      {children}
      <Popover
        open={Boolean(popup)}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={popup?.anchorPosition}
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
          <>
            <Typography sx={{ fontSize: "150%" }}>{popup.word}</Typography>
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
                <CircularProgress color="inherit" size={24} />
              )}
              {popup.lookup.status === "empty" && (
                <Typography>중고음 자료가 없습니다.</Typography>
              )}
              {popup.lookup.status === "error" && (
                <Typography>중고음 자료를 불러오지 못했습니다.</Typography>
              )}
            </Grid>
          </>
        )}
      </Popover>
    </div>
  );
}
