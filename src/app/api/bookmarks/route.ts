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

  const sentenceId = request.nextUrl.searchParams.get("sentenceId");
  if (!sentenceId) {
    return NextResponse.json({ error: "sentenceId required" }, { status: 400 });
  }

  const pool = await getPool();
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
