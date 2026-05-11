import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { getPool } from "@/app/db";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const pool = await getPool();

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
    [name || null, email, passwordHash],
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
