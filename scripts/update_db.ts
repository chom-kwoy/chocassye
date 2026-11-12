"use strict";

import pg from "pg";

import {
  collect_corpus_filenames,
  delete_missing_documents,
} from "../src/utils/delete_missing_documents";
import { insert_txt_documents } from "../src/utils/parse_txt.js";
import { insert_xml_documents } from "../src/utils/parse_xml.js";

// Synchronize added/deleted documents using parsed filenames in the books table.
// Existing documents are not reimported; ibpe indexes are rebuilt afterwards.
async function update_db(database_name: string, doc_cnt: number | null) {
  // Validate the complete inventory before modifying the database.
  const corpus_filenames = await collect_corpus_filenames();
  const { Pool } = pg;
  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: database_name,
    password: "password",
  });
  console.log("Connected successfully to database:", database_name);

  try {
    // Collect filenames already present in the database.
    const { rows } = await pool.query("SELECT filename FROM books;");
    const existing_filenames = new Set(
      rows.map((r: { filename: string }) => r.filename),
    );
    console.log(existing_filenames.size, "books already in database.");

    const dry_run = process.env.DRY_RUN === "yes";
    await delete_missing_documents(
      pool,
      existing_filenames,
      corpus_filenames,
      dry_run,
    );
    if (dry_run) {
      console.log("Dry run: no documents or indexes were modified.");
      return;
    }

    const BATCH_SIZE = process.env.BATCH ? parseInt(process.env.BATCH) : 256;
    console.log("Batch size:", BATCH_SIZE);

    await insert_xml_documents(pool, BATCH_SIZE, doc_cnt, existing_filenames);
    await insert_txt_documents(pool, BATCH_SIZE, doc_cnt, existing_filenames);

    // Rebuild the ibpe indexes after insertions and deletions.
    console.log("Rebuilding ibpe indexes...");
    await pool.query("DROP INDEX IF EXISTS my_ibpe_index_1;");
    await pool.query(`
    CREATE INDEX my_ibpe_index_1 ON sentences
      USING ibpe (text) with (
        tokenizer_path = '/var/lib/postgresql/tokenizer1.json',
        normalize_mappings = '{".": "x", "/": "Z", "\\\\": "X", "\`": "C"}'
      );
  `);
    await pool.query("DROP INDEX IF EXISTS my_ibpe_index_2;");
    await pool.query(`
    CREATE INDEX my_ibpe_index_2 ON sentences
      USING ibpe (text_without_sep) with (
        tokenizer_path = '/var/lib/postgresql/tokenizer2.json',
        normalize_mappings = '{".": "x", "/": "Z", "\\\\": "X", "\`": "C"}'
      );
  `);
    console.log("Rebuilt ibpe indexes.");
  } finally {
    await pool.end();
  }
}

if (!process.env.DB_NAME) {
  console.error(
    "Please set the DB_NAME environment variable. (optional: set DOC_CNT)",
  );
  process.exit(1);
}
const doc_cnt = process.env.DOC_CNT ? parseInt(process.env.DOC_CNT) : null;
update_db(process.env.DB_NAME, doc_cnt)
  .then(() => {
    console.log("Database updated successfully.");
  })
  .catch((error) => {
    console.error("Database update failed:", error);
    process.exitCode = 1;
  });
