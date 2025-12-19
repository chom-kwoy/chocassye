import { Pool, PoolClient, QueryResult } from "pg";

export type InsertBook = {
  filename: string;
  year: number;
  year_start: number;
  year_end: number;
  year_string: string;
  year_sort: number;
  decade_sort: number;
  attributions: {
    role: string;
    name: string;
  }[];
  bibliography: string;
  num_sentences: number;
  non_chinese_sentence_count: number;
};

export type InsertSentence = {
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
};

export async function insert_into_db(
  pool: Pool,
  book_details: InsertBook,
  sentences: InsertSentence[],
) {
  const client = await pool.connect();

  await deadlock_retry(
    client,
    `
      INSERT INTO books (
        filename, year, year_sort, decade_sort, year_start, year_end, year_string,
        attributions, bibliography, num_sentences, non_chinese_sentence_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      );
    `,
    [
      book_details.filename,
      book_details.year,
      book_details.year_sort,
      book_details.decade_sort,
      book_details.year_start,
      book_details.year_end,
      book_details.year_string,
      JSON.stringify(book_details.attributions),
      book_details.bibliography,
      book_details.num_sentences,
      book_details.non_chinese_sentence_count,
    ],
  );

  for (const sentence of sentences) {
    await deadlock_retry(
      client,
      `
        INSERT INTO sentences (
          filename, section, text, text_without_sep, text_with_tone, html,
          type, lang, page_start, page_end, orig_tag, 
          number_in_page, number_in_book, year_sort, decade_sort
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING id;
      `,
      [
        sentence.filename,
        sentence.section,
        sentence.text,
        sentence.text_without_sep,
        sentence.text_with_tone,
        sentence.html,
        sentence.type,
        sentence.lang,
        sentence.page_start,
        sentence.page_end,
        sentence.orig_tag,
        sentence.number_in_page,
        sentence.number_in_book,
        sentence.year_sort,
        sentence.decade_sort,
      ],
    );
  }

  client.release();
}

function deadlock_retry(
  client: PoolClient,
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
): Promise<QueryResult> {
  return client.query(query, args).catch((err) => {
    if (err.code === "40P01") {
      console.error("Deadlock detected, retrying...");
      return deadlock_retry(client, query, args);
    } else {
      throw err;
    }
  });
}
