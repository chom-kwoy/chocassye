"use client";

import AddIcon from "@mui/icons-material/Add";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import React from "react";

import { useTranslation } from "@/components/TranslationProvider";

type Category = { id: number; name: string };

export function BookmarkButton({
  sentenceId,
  initiallyBookmarked,
}: {
  sentenceId: number;
  initiallyBookmarked: boolean;
}) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = React.useState<Set<number>>(
    new Set(),
  );
  const [isBookmarked, setIsBookmarked] = React.useState(initiallyBookmarked);
  const [newName, setNewName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [errorOpen, setErrorOpen] = React.useState(false);

  const open = Boolean(anchorEl);

  async function handleClick(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
    if (!session?.user) {
      setErrorOpen(true);
      return;
    }
    setAnchorEl(e.currentTarget);
    setLoading(true);
    const [catsRes, bmsRes] = await Promise.all([
      fetch("/api/bookmarks/categories"),
      fetch(`/api/bookmarks?sentenceId=${sentenceId}`),
    ]);
    const [cats, bms]: [Category[], { categoryId: number }[]] =
      await Promise.all([catsRes.json(), bmsRes.json()]);
    setCategories(cats);
    const ids = new Set(bms.map((b) => b.categoryId));
    setBookmarkedIds(ids);
    setIsBookmarked(ids.size > 0);
    setLoading(false);
  }

  async function handleToggle(categoryId: number) {
    let newIds: Set<number>;
    if (bookmarkedIds.has(categoryId)) {
      newIds = new Set(bookmarkedIds);
      newIds.delete(categoryId);
      await fetch(
        `/api/bookmarks?sentenceId=${sentenceId}&categoryId=${categoryId}`,
        { method: "DELETE" },
      );
    } else {
      newIds = new Set([...bookmarkedIds, categoryId]);
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentenceId, categoryId }),
      });
    }
    setBookmarkedIds(newIds);
    setIsBookmarked(newIds.size > 0);
  }

  async function handleAddCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/bookmarks/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const cat: Category = await res.json();
    setCategories((prev) =>
      prev.find((c) => c.id === cat.id) ? prev : [...prev, cat],
    );
    setNewName("");
    setAdding(false);
    handleToggle(cat.id);
  }

  return (
    <>
      <Tooltip
        title={t("Bookmarks")}
        slotProps={{ popper: { sx: { pointerEvents: "none" } } }}
      >
        <IconButton
          size="small"
          className="bookmark-btn"
          onClick={handleClick}
          sx={{
            p: 0.25,
            // Always visible when bookmarked; otherwise shown by parent CSS :hover rule.
            visibility: isBookmarked || open ? "visible" : "hidden",
            color: isBookmarked ? "primary.main" : "text.disabled",
            "&:hover": { color: "primary.main" },
          }}
        >
          {isBookmarked ? (
            <BookmarkIcon sx={{ fontSize: 16 }} />
          ) : (
            <BookmarkBorderIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ minWidth: 200, maxWidth: 280 }}>
          <Typography
            variant="subtitle2"
            sx={{ px: 2, pt: 1, pb: 0.5, color: "text.secondary" }}
          >
            {t("Add bookmark to…")}
          </Typography>
          <Divider />
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense disablePadding>
              {categories.map((cat) => (
                <ListItem
                  key={cat.id}
                  dense
                  onClick={() => handleToggle(cat.id)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      size="small"
                      checked={bookmarkedIds.has(cat.id)}
                      disableRipple
                      tabIndex={-1}
                    />
                  </ListItemIcon>
                  <ListItemText primary={cat.name} />
                </ListItem>
              ))}
            </List>
          )}

          <Divider />

          <Box sx={{ px: 1, py: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t("New category…")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleAddCategory}
                        disabled={!newName.trim() || adding}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Box>
      </Popover>

      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
        onClose={() => setErrorOpen(false)}
        message={t("Please sign in to use bookmarks")}
      />
    </>
  );
}
