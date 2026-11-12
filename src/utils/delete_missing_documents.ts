import { glob } from "glob";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";

import {
  year_and_bookname_from_filename,
  year_and_bookname_from_format_2_filename,
} from "./parse_utils.js";

export async function collect_corpus_filenames(
  data_dir = "chocassye-corpus/data",
): Promise<Set<string>> {
  if (!(await stat(data_dir)).isDirectory()) {
    throw new Error(`Corpus directory is not a directory: ${data_dir}`);
  }
  // Always inspect the complete corpus, regardless of insertion filters.
  const files = await glob("*/*.{xml,txt}", { cwd: data_dir, nodir: true });
  if (files.length === 0) {
    throw new Error(
      `No corpus files found in ${data_dir}; refusing to delete data.`,
    );
  }

  const filenames = new Set<string>();
  for (const relative_path of files) {
    const file = path.join(data_dir, relative_path);
    if (file.endsWith(".xml")) {
      filenames.add(year_and_bookname_from_filename(file).filename);
      continue;
    }

    // Format 2 uses a different filename convention, including in unknown/.
    // Do not apply SKIP_FORMAT_* here: skipped files still exist on disk.
    const text = (await readFile(file, "utf8")).replace(/^\uFEFF/, "");
    const first_line = text.split("\n", 1)[0];
    if (first_line.includes("<title>")) {
      filenames.add(year_and_bookname_from_filename(file).filename);
    } else if (first_line.startsWith("<item ")) {
      filenames.add(year_and_bookname_from_format_2_filename(file).filename);
    } else {
      // Unsupported/malformed text files are skipped by the importer, but they
      // still exist. Preserve either possible name instead of treating them
      // as deleted (for example, after a header was edited).
      filenames.add(year_and_bookname_from_filename(file).filename);
      filenames.add(year_and_bookname_from_format_2_filename(file).filename);
    }
  }
  return filenames;
}

export async function delete_missing_documents(
  pool: Pool,
  existing_filenames: Set<string>,
  corpus_filenames: Set<string>,
  dry_run = false,
) {
  const deleted_filenames = [...existing_filenames].filter(
    (filename) => !corpus_filenames.has(filename),
  );
  console.log(
    deleted_filenames.length,
    "books no longer present in the corpus:",
  );
  for (const filename of deleted_filenames) console.log(filename);
  if (dry_run || deleted_filenames.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sentences = await client.query(
      "DELETE FROM sentences WHERE filename = ANY($1::text[])",
      [deleted_filenames],
    );
    const books = await client.query(
      "DELETE FROM books WHERE filename = ANY($1::text[])",
      [deleted_filenames],
    );
    await client.query("COMMIT");
    console.log(
      "Deleted",
      sentences.rowCount,
      "sentences and",
      books.rowCount,
      "books.",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
