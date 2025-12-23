import { format } from "node-pg-format";
import { PoolClient } from "pg";

import { searchTerm2Regex } from "@/components/Regex.mjs";

export type Sentence = {
  id: number;
  filename: string;
  section: string;
  text: string;
  text_without_sep: string;
  text_with_tone: string | null;
  html: string;
  type: string;
  lang: string;
  page_start: string;
  page_end: string;
  orig_tag: string;
  number_in_page: string;
  number_in_book: number;
  year_sort: number;
  decade_sort: number;
  is_target: boolean;
  scan_urls:
    | {
        edition: string;
        page: string;
        url: string;
      }[]
    | null;
};

type SentenceRow = {
  filename: string;
  number_in_book: number;
  sentences: Sentence[];
  year: number;
  year_start: number;
  year_end: number;
  year_string: string;
  year_sort: number;
  bibliography: string;
  num_sentences: number;
  non_chinese_sentence_count: number;
};

export async function makeCorpusQuery(
  client: PoolClient,
  term: string,
  doc: string,
  excludeModern: boolean,
  ignoreSep: boolean,
  offset: number,
  count: number,
): Promise<SentenceRow[] | null> {
  if (term === "") {
    return null;
  }

  const regex = searchTerm2Regex(term, ignoreSep);

  console.log("regex: ", regex);

  let filterDoc = "";
  if (doc !== "") {
    filterDoc = format(" AND st.filename LIKE %L", ["%" + doc + "%"]);
  }

  let filterLang = "";
  if (excludeModern) {
    filterLang = `
        AND (
          st.lang IS NULL 
          OR (st.lang NOT IN ('mod', 'modern translation', 'pho') 
              AND st.lang NOT LIKE '%역')
        )
      `;
  }

  const textFieldName = ignoreSep ? "st.text_without_sep" : "st.text";

  const queryString = format(
    `
      WITH results AS (
      SELECT st.*
        FROM sentences st
        WHERE ${textFieldName} ~ %L
              ${filterDoc} ${filterLang}
        ORDER BY
          st.year_sort ASC,
          st.filename::bytea ASC,
          st.number_in_book ASC
        OFFSET %L
        LIMIT %L
      ),
      context AS (
      SELECT st.*,
        r.id AS main_id,
        r.filename AS main_filename,
        r.number_in_book AS main_number_in_book,
        r.year_sort AS main_year_sort,
        (r.id = st.id) AS is_target
        FROM sentences st
          JOIN results r 
            ON st.filename = r.filename
            AND st.number_in_book BETWEEN
                r.number_in_book-5 AND r.number_in_book+5
      ),
      context_with_images AS (
        SELECT *, (
          SELECT array_agg(i) FROM (
            SELECT im.page, im.edition, im.url
            FROM images im
            WHERE im.book_name = r.filename
            AND COALESCE(im.section, '') = COALESCE(r.section, '')
            AND (im.page = r.page_start OR im.page = r.page_end)
            ) i
          ) AS scan_urls
        FROM context r
      ),
      context_grouped AS (
        SELECT
          main_id,
          ANY_VALUE(main_filename) AS main_filename,
          ANY_VALUE(main_number_in_book) AS main_number_in_book,
          ANY_VALUE(main_year_sort) AS main_year_sort,
          jsonb_agg(c) AS sentences
        FROM context_with_images c
        GROUP BY main_id
      )
      SELECT b.*, c.sentences, c.main_number_in_book AS number_in_book
      FROM context_grouped c
      JOIN books b ON c.main_filename = b.filename
      ORDER BY
        c.main_year_sort ASC,
        c.main_filename::bytea ASC,
        c.main_number_in_book ASC
      `,
    [regex.source],
    offset,
    count,
  );

  console.log("Query string = ", queryString);

  const results = await client.query(queryString);

  return results.rows;
}

export async function makeCorpusStatsQuery(
  term: string,
  doc: string,
  excludeModern: boolean,
  ignoreSep: boolean,
) {
  if (term === "") {
    return null;
  }

  const regex = searchTerm2Regex(term, ignoreSep);

  const textFieldName = ignoreSep ? "st.text_without_sep" : "st.text";

  let filterDoc = "";
  if (doc !== "") {
    filterDoc = format(" AND st.filename LIKE %L", ["%" + doc + "%"]);
  }

  let filterLang = "";
  if (excludeModern) {
    filterLang = `
        AND (
          st.lang IS NULL 
          OR (st.lang NOT IN ('mod', 'modern translation', 'pho') 
              AND st.lang NOT LIKE '%역')
        )
      `;
  }

  return format(
    `
      SELECT 
          st.decade_sort AS period, 
          CAST(COUNT(DISTINCT st.id) AS INTEGER) AS num_hits
        FROM sentences st
        WHERE ${textFieldName} ~ %L
              ${filterDoc} ${filterLang}
        GROUP BY st.decade_sort
    `,
    [regex.source],
  );
}
