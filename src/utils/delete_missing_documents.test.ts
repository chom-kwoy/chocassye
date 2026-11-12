/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Pool } from "pg";

import {
  collect_corpus_filenames,
  delete_missing_documents,
} from "./delete_missing_documents";

const temporary_dirs: string[] = [];

async function corpus(files: Record<string, string>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "corpus-sync-"));
  temporary_dirs.push(dir);
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(dir, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text);
  }
  return dir;
}

afterEach(async () => {
  jest.restoreAllMocks();
  await Promise.all(
    temporary_dirs
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("collect_corpus_filenames", () => {
  it("uses importer names for XML and both TXT formats, ignoring insertion filters", async () => {
    jest.replaceProperty(process, "env", {
      ...process.env,
      FILE: "nonexistent",
      DOC_CNT: "1",
      SKIP_FORMAT_1: "yes",
      SKIP_FORMAT_2: "yes",
    });
    const dir = await corpus({
      "16C/１５００_Book_One.xml": "<book/>",
      "unknown/Unknown_Book.xml": "<book/>",
      "sktot/Gugyeol_Volume.xml": "<book/>",
      "others/1600_Text_One.txt": "\ufeff<title>Book</title>\nText",
      "unknown/1700_Text_Two.txt": '<item id="1">\nText',
      "others/NoDate.txt": '<item id="2">\nText',
      "others/README.md": "Not imported",
    });

    expect(await collect_corpus_filenames(dir)).toEqual(
      new Set([
        "Book One",
        "Unknown Book",
        "Gugyeol Volume",
        "Text One",
        "Text Two",
        "NoDate",
      ]),
    );
  });

  it("keeps a document while another source with the same parsed name exists", async () => {
    const dir = await corpus({
      "16C/1500_Shared.xml": "<book/>",
      "others/1500_Shared.txt": "<title>Book</title>\nText",
    });
    await rm(path.join(dir, "16C/1500_Shared.xml"));
    expect(await collect_corpus_filenames(dir)).toEqual(new Set(["Shared"]));
  });

  it("does not treat an unrecognized text header as a deleted file", async () => {
    const dir = await corpus({
      "unknown/1700_Existing.txt": "Edited header\nText",
    });
    expect(await collect_corpus_filenames(dir)).toEqual(
      new Set(["1700 Existing", "Existing"]),
    );
  });

  it("refuses an empty or missing corpus directory", async () => {
    const dir = await corpus({});
    await expect(collect_corpus_filenames(dir)).rejects.toThrow(
      "No corpus files found",
    );
    await expect(
      collect_corpus_filenames(path.join(dir, "missing")),
    ).rejects.toThrow();
  });
});

function mockPool() {
  const query = jest
    .fn<(sql: string, values?: string[][]) => Promise<{ rowCount: number }>>()
    .mockResolvedValue({ rowCount: 1 });
  const client = { query, release: jest.fn() };
  const connect = jest
    .fn<() => Promise<typeof client>>()
    .mockResolvedValue(client);
  return { pool: { connect } as unknown as Pool, connect, client, query };
}

describe("delete_missing_documents", () => {
  it("deletes only missing documents, with parameterized SQL in one transaction", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const { pool, query, client } = mockPool();
    const removed = "Removed ' Book";
    await delete_missing_documents(
      pool,
      new Set(["Kept", removed]),
      new Set(["Kept", "New"]),
    );

    expect(query.mock.calls).toEqual([
      ["BEGIN"],
      ["DELETE FROM sentences WHERE filename = ANY($1::text[])", [[removed]]],
      ["DELETE FROM books WHERE filename = ANY($1::text[])", [[removed]]],
      ["COMMIT"],
    ]);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("rolls back sentence deletion if book deletion fails", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const { pool, query, client } = mockPool();
    const failure = new Error("Book deletion failed");
    query.mockImplementation(async (sql) => {
      if (sql.startsWith("DELETE FROM books")) throw failure;
      return { rowCount: 1 };
    });
    await expect(
      delete_missing_documents(pool, new Set(["Removed"]), new Set(["Kept"])),
    ).rejects.toThrow(failure);
    expect(query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(query).not.toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("makes no changes in dry-run mode or when no files were deleted", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const { pool, connect } = mockPool();
    await delete_missing_documents(
      pool,
      new Set(["Removed"]),
      new Set(["Kept"]),
      true,
    );
    await delete_missing_documents(
      pool,
      new Set(["Kept"]),
      new Set(["Kept", "New"]),
    );
    expect(connect).not.toHaveBeenCalled();
  });
});
