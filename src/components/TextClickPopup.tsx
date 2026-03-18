"use client";

import {
  Card,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import Popover from "@mui/material/Popover";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Reading, getMCData } from "@/app/hanja/middleChinese";
import { MiddleChinesePronInfo } from "@/app/hanja/page";

interface PopupState {
  word: string;
  anchorPosition: { top: number; left: number };
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
  const [data, setData] = React.useState<{
    char: string;
    readings: Reading[];
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    const result = getWordAtPoint(e.clientX, e.clientY);
    if (result) {
      const { word, pos } = result;
      setPopup({
        word,
        anchorPosition: {
          top: (pos?.y ?? e.clientY) + 5,
          left: pos?.x ?? e.clientX,
        },
      });
      getMCData(word).then((readings) => {
        setData(readings === null ? null : { char: word, readings });
      });
    } else {
      setPopup(null);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("click", handleClick);
    };
  }, [handleClick]);

  const handleClose = useCallback(() => {
    setPopup(null);
    setData(null);
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
              {data?.readings.map((reading, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? (
                    <Grid size={12}>
                      <Divider />
                    </Grid>
                  ) : null}
                  <Grid size={12}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={1}>{i + 1}</Grid>
                      <MiddleChinesePronInfo reading={reading} leftWidth={3} />
                    </Grid>
                  </Grid>
                </React.Fragment>
              ))}
              {!data && <CircularProgress color="inherit" />}
            </Grid>
          </>
        )}
      </Popover>
    </div>
  );
}
