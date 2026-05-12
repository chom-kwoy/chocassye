import { redirect } from "next/navigation";

import { getPool } from "@/app/db";
import { auth } from "@/auth";

import { BookmarksPage } from "./BookmarksPage";

export type Category = { id: number; name: string };

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = parseInt(session.user.id, 10);
  const pool = await getPool();

  let { rows: categories } = await pool.query<Category>(
    `SELECT id, name FROM bookmark_categories WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId],
  );

  if (categories.length === 0) {
    const inserted = await pool.query<Category>(
      `INSERT INTO bookmark_categories (user_id, name) VALUES ($1, 'Favorites')
       ON CONFLICT DO NOTHING RETURNING id, name`,
      [userId],
    );
    categories = inserted.rows;
  }

  return <BookmarksPage initialCategories={categories} />;
}
