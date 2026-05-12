import { NextRequest, NextResponse } from "next/server";

import { getPool } from "@/app/db";
import { auth } from "@/auth";

async function getUserId(): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return parseInt(session.user.id, 10);
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const sentenceId = params.get("sentenceId");
  const categoryId = params.get("categoryId");

  const pool = await getPool();

  if (categoryId) {
    const result = await pool.query(
      `WITH results AS (
         SELECT s.*, bm.id AS bookmark_id, bm.category_id AS bookmark_category_id
         FROM bookmarks bm
         JOIN sentences s ON bm.sentence_id = s.id
         WHERE bm.user_id = $1 AND bm.category_id = $2
       ),
       context AS (
         SELECT st.*,
           r.id                    AS main_id,
           r.bookmark_id           AS main_bookmark_id,
           r.bookmark_category_id  AS main_category_id,
           r.number_in_book        AS main_number_in_book,
           r.year_sort             AS main_year_sort,
           r.filename              AS main_filename,
           (r.id = st.id)          AS is_target
         FROM sentences st
         JOIN results r ON st.filename = r.filename
           AND st.number_in_book BETWEEN r.number_in_book - 5 AND r.number_in_book + 5
       ),
       context_with_images AS (
         SELECT *, (
           SELECT array_agg(i) FROM (
             SELECT im.page, im.edition, im.url
             FROM images im
             WHERE im.book_name = c.filename
               AND COALESCE(im.section, '') = COALESCE(c.section, '')
               AND (im.page = c.page_start OR im.page = c.page_end)
           ) i
         ) AS scan_urls
         FROM context c
       ),
       context_grouped AS (
         SELECT
           main_id,
           ANY_VALUE(main_bookmark_id)  AS bookmark_id,
           ANY_VALUE(main_category_id)  AS category_id,
           ANY_VALUE(main_number_in_book) AS main_number_in_book,
           ANY_VALUE(main_year_sort)    AS main_year_sort,
           ANY_VALUE(main_filename)     AS main_filename,
           jsonb_agg(c)                 AS sentences
         FROM context_with_images c
         GROUP BY main_id
       )
       SELECT
         cg.bookmark_id           AS "bookmarkId",
         cg.main_id               AS "sentenceId",
         cg.category_id           AS "categoryId",
         cg.sentences,
         b.filename               AS "bookName",
         b.year                   AS "bookYear",
         b.year_start             AS "bookYearStart",
         b.year_end               AS "bookYearEnd",
         b.year_string            AS "yearString",
         b.year_sort              AS "bookYearSort"
       FROM context_grouped cg
       JOIN books b ON cg.main_filename = b.filename
       ORDER BY
         cg.main_year_sort ASC NULLS LAST,
         cg.main_filename::bytea ASC,
         cg.main_number_in_book ASC`,
      [userId, parseInt(categoryId, 10)],
    );
    return NextResponse.json(result.rows);
  }

  if (!sentenceId) {
    return NextResponse.json(
      { error: "sentenceId or categoryId required" },
      { status: 400 },
    );
  }

  const result = await pool.query(
    `SELECT category_id AS "categoryId"
     FROM bookmarks
     WHERE user_id = $1 AND sentence_id = $2`,
    [userId, parseInt(sentenceId, 10)],
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sentenceId, categoryId } = await request.json();
  if (!sentenceId || !categoryId) {
    return NextResponse.json(
      { error: "sentenceId and categoryId required" },
      { status: 400 },
    );
  }

  const pool = await getPool();
  await pool.query(
    `INSERT INTO bookmarks (user_id, sentence_id, category_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, sentence_id, category_id) DO NOTHING`,
    [userId, sentenceId, categoryId],
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sentenceId = request.nextUrl.searchParams.get("sentenceId");
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  if (!sentenceId || !categoryId) {
    return NextResponse.json(
      { error: "sentenceId and categoryId required" },
      { status: 400 },
    );
  }

  const pool = await getPool();
  await pool.query(
    `DELETE FROM bookmarks
     WHERE user_id = $1 AND sentence_id = $2 AND category_id = $3`,
    [userId, parseInt(sentenceId, 10), parseInt(categoryId, 10)],
  );

  return NextResponse.json({ success: true });
}
