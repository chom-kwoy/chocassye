"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableContainer,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

import { SentenceWithCtx } from "@/app/search/SentenceWithCtx";
import { Book, SentenceWithContext } from "@/app/search/search";
import { useTranslation } from "@/components/TranslationProvider";
import { YearCell } from "@/components/YearCell";
import { StyledTableCell, StyledTableRow } from "@/components/client_utils";
import { Sentence } from "@/utils/search";

import type { Category } from "./page";

type BookmarkEntry = {
  bookmarkId: number;
  sentenceId: number;
  categoryId: number;
  sentences: Sentence[];
  bookName: string;
  bookYear: number;
  bookYearStart: number;
  bookYearEnd: number;
  yearString: string;
  bookYearSort: number;
};

function entryToSentenceAndBook(entry: BookmarkEntry): {
  sentenceWithCtx: SentenceWithContext;
  book: Book;
} {
  const sorted = [...entry.sentences].sort(
    (a, b) => a.number_in_book - b.number_in_book,
  );
  const targetIdx = sorted.findIndex((s) => s.is_target);
  const sentenceWithCtx: SentenceWithContext = {
    mainSentence: { ...sorted[targetIdx], is_bookmarked: true },
    contextBefore: sorted.slice(0, targetIdx),
    contextAfter: sorted.slice(targetIdx + 1),
  };
  const book: Book = {
    name: entry.bookName,
    year: entry.bookYear,
    year_start: entry.bookYearStart,
    year_end: entry.bookYearEnd,
    year_string: entry.yearString,
    year_sort: entry.bookYearSort,
    sentences: [sentenceWithCtx],
    count: 1,
  };
  return { sentenceWithCtx, book };
}

function BookmarkRow({
  entry,
  romanize,
  onDelete,
}: {
  entry: BookmarkEntry;
  romanize: boolean;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  const { sentenceWithCtx, book } = entryToSentenceAndBook(entry);

  return (
    <StyledTableRow
      sx={{ "&:hover .bookmark-action-btn": { visibility: "visible" } }}
    >
      <YearCell
        year={book.year}
        yearStart={book.year_start}
        yearEnd={book.year_end}
        yearString={book.year_string}
      />

      <StyledTableCell sx={{ position: "relative" }}>
        <SentenceWithCtx
          sentenceWithCtx={sentenceWithCtx}
          book={book}
          matchIdsInSentence={[]}
          highlightTerm=""
          ignoreSep={false}
          romanize={romanize}
          showBookmark={false}
        />

        <span
          style={{
            position: "absolute",
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <IconButton
            size="small"
            className="bookmark-action-btn"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ visibility: menuAnchor ? "visible" : "hidden" }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </span>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem
            onClick={async () => {
              setMenuAnchor(null);
              await fetch(
                `/api/bookmarks?sentenceId=${entry.sentenceId}&categoryId=${entry.categoryId}`,
                { method: "DELETE" },
              );
              onDelete();
            }}
          >
            {t("Delete")}
          </MenuItem>
        </Menu>
      </StyledTableCell>
    </StyledTableRow>
  );
}

export function BookmarksPage({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const { t } = useTranslation();
  const [categories, setCategories] = React.useState(initialCategories);
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [bookmarks, setBookmarks] = React.useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [romanize, setRomanize] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const selectedCategory = categories[selectedTab];

  React.useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);
    setBookmarks([]);
    fetch(`/api/bookmarks?categoryId=${selectedCategory.id}`)
      .then((r) => r.json())
      .then((data) => {
        setBookmarks(data);
        setLoading(false);
      });
  }, [selectedCategory?.id]);

  async function handleCreateCategory() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const res = await fetch("/api/bookmarks/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const created: Category = await res.json();
      setCategories((prev) => [...prev, created]);
      setSelectedTab(categories.length);
    }
    setCreating(false);
    setDialogOpen(false);
    setNewName("");
  }

  async function handleDeleteCategory() {
    if (!selectedCategory) return;
    await fetch(`/api/bookmarks/categories?categoryId=${selectedCategory.id}`, {
      method: "DELETE",
    });
    const next = categories.filter((c) => c.id !== selectedCategory.id);
    setCategories(next);
    setSelectedTab(Math.min(selectedTab, next.length - 1));
    setDeleteConfirmOpen(false);
  }

  function handleDelete(sentenceId: number, categoryId: number) {
    setBookmarks((prev) =>
      prev.filter(
        (b) => !(b.sentenceId === sentenceId && b.categoryId === categoryId),
      ),
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
        {t("My Bookmarks")}
      </Typography>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewName("");
        }}
        PaperProps={{
          component: "form",
          onSubmit: (e: React.FormEvent) => {
            e.preventDefault();
            handleCreateCategory();
          },
        }}
      >
        <DialogTitle>{t("New category…")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            size="small"
            label={t("Name")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setNewName("");
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!newName.trim() || creating}
            variant="contained"
          >
            {t("Add")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>{t("Delete category")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("Delete category confirm", {
              name: selectedCategory?.name ?? "",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleDeleteCategory}
            color="error"
            variant="contained"
          >
            {t("Delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {categories.length === 0 ? (
        <Typography color="text.secondary">{t("No bookmarks yet")}</Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tabs
              value={selectedTab}
              onChange={(_, v) => {
                if (v === categories.length) {
                  setDialogOpen(true);
                } else {
                  setSelectedTab(v);
                }
              }}
              sx={{ flexGrow: 1, mb: 1 }}
            >
              {categories.map((cat) => (
                <Tab key={cat.id} label={cat.name} />
              ))}
              <Tab icon={<AddIcon />} sx={{ minWidth: 48 }} />
            </Tabs>
            <IconButton
              size="small"
              onClick={() => setDeleteConfirmOpen(true)}
              title={t("Delete category")}
              sx={{ mb: 1, ml: 1 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
          <Divider />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mb: 1 }}
          >
            <FormControlLabel
              control={<Checkbox size="small" sx={{ py: 0 }} />}
              label={
                <Typography sx={{ fontSize: "1em" }}>
                  {t("Romanization")}
                </Typography>
              }
              checked={romanize}
              onChange={() => setRomanize((r) => !r)}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : bookmarks.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 3, textAlign: "center" }}
            >
              {t("No bookmarks yet")}
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              elevation={3}
              style={{ overflow: "visible" }}
            >
              <Table size="small">
                <TableBody>
                  {bookmarks.map((entry) => (
                    <BookmarkRow
                      key={entry.bookmarkId}
                      entry={entry}
                      romanize={romanize}
                      onDelete={() =>
                        handleDelete(entry.sentenceId, entry.categoryId)
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </>
  );
}
