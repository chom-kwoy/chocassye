"use server";

import { format } from "node-pg-format";

import { getPool } from "@/app/db";

export type Sentence = {
  html: string;
  text: string;
  page_start: string;
  page_end: string;
  type: string;
  lang: string;
  scan_urls:
    | {
        url: string;
        page: string;
        edition: string;
      }[]
    | null;
};

export type SourceData = {
  name: string;
  year_string: string;
  bibliography: string;
  attributions: { role: string; name: string }[];
  sentences: Sentence[];
  count: number;
};

export async function fetchSource(
  bookName: string,
  numberInSource: number,
  excludeChinese: boolean,
  pageSize: number,
): Promise<
  { status: "success"; data: SourceData } | { status: "error"; msg: string }
> {
  if (isNaN(pageSize) || pageSize > 200) {
    return {
      status: "error",
      msg: "Invalid view_count",
    };
  }

  const start = Math.floor(numberInSource / pageSize) * pageSize;
  const end = start + pageSize;
  console.log(
    `source doc=${bookName} page=${start}-${end} ${typeof excludeChinese}`,
  );

  const excludeChineseString = excludeChinese ? "AND lang NOT IN ('chi')" : "";

  try {
    const pool = await getPool();

    const queryString = format(
      `
        SELECT *, (
          SELECT jsonb_agg(i) FROM (
             SELECT im.page, im.edition, im.url
             FROM images im
             WHERE im.book_name = r.filename
               AND COALESCE(im.section, '') = COALESCE(r.section, '')
               AND (im.page = r.page_start OR im.page = r.page_end)
            ) i
          ) AS scan_urls
          FROM sentences r
          WHERE
            filename = %L
            ${excludeChineseString}
          ORDER BY number_in_book ASC
          OFFSET %L
          LIMIT %L
      `,
      bookName,
      start,
      pageSize,
    );
    console.log(queryString);

    const [book, sentences] = await Promise.all([
      pool.query(`SELECT * FROM books WHERE filename = $1`, [bookName]),
      pool.query(queryString),
    ]);
    console.log("Successfully retrieved source");

    if (book.rows.length === 0 || sentences.rows.length === 0) {
      return {
        status: "error",
        msg: "No results found",
      };
    } else {
      const curBook = book.rows[0];
      const data = {
        name: curBook.filename,
        year_string: curBook.year_string,
        bibliography: curBook.bibliography,
        attributions: curBook.attributions,
        sentences: sentences.rows,
        count: excludeChinese
          ? curBook.non_chinese_sentence_count
          : curBook.num_sentences,
      };
      return {
        status: "success",
        data: data,
      };
    }
  } catch (err) {
    console.log("Error retrieving source:", err);
    return {
      status: "error",
      msg: "Database query failed",
    };
  }
}
