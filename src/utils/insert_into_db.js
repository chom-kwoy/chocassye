function deadlock_retry(client, query, args = []) {
  return client.query(query, args).catch((err) => {
    if (err.code === "40P01") {
      console.error("Deadlock detected, retrying...");
      return deadlock_retry(client, query, args);
    } else {
      throw err;
    }
  });
}

export async function insert_into_db(pool, book_details, sentences) {
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

  for (let sentence of sentences) {
    await deadlock_retry(
      client,
      `
        INSERT INTO sentences (
          filename, text, text_without_sep, text_with_tone, html,
          type, lang, page, orig_tag, number_in_page, number_in_book, hasImages,
          year_sort, decade_sort
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id;
      `,
      [
        sentence.filename,
        sentence.text,
        sentence.text_without_sep,
        sentence.text_with_tone,
        sentence.html,
        sentence.type,
        sentence.lang,
        sentence.page,
        sentence.orig_tag,
        sentence.number_in_page,
        sentence.number_in_book,
        sentence.hasImages,
        sentence.year_sort,
        sentence.decade_sort,
      ],
    );
  }

  client.release();
}
