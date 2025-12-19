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
  page: string;
  orig_tag: string;
  number_in_page: string;
  number_in_book: number;
  year_sort: number;
  decade_sort: number;
  is_target: boolean;
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
        SELECT 
          r.id,
          r.filename,
          r.number_in_book,
          r.year_sort,
          array_agg(
            to_jsonb(st) || jsonb_build_object(
              'is_target', (r.id = st.id)
            )
          ) AS sentences
        FROM sentences st
          JOIN results r 
            ON st.filename = r.filename
            AND st.number_in_book BETWEEN
                r.number_in_book-5 AND r.number_in_book+5
          GROUP BY r.id, r.filename, r.number_in_book, r.year_sort
      )
      SELECT b.*, c.sentences, c.number_in_book
      FROM context c
      JOIN books b ON c.filename = b.filename
      ORDER BY
        c.year_sort ASC,
        c.filename::bytea ASC,
        c.number_in_book ASC
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
