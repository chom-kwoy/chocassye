import { NextRequest, NextResponse } from "next/server";

import { getPool } from "@/app/db";
import { auth } from "@/auth";

async function getUserId(): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return parseInt(session.user.id, 10);
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await getPool();

  // Auto-create "Favorites" if user has no categories yet
  await pool.query(
    `INSERT INTO bookmark_categories (user_id, name)
     VALUES ($1, 'Favorites')
     ON CONFLICT (user_id, name) DO NOTHING`,
    [userId],
  );

  const result = await pool.query(
    `SELECT id, name FROM bookmark_categories
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO bookmark_categories (user_id, name)
     VALUES ($1, $2)
     ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [userId, name.trim()],
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
