-- Run once to create the users table for NextAuth authentication.
-- psql -U postgres -d chocassye -f scripts/create_users_table.sql

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        TEXT,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT,      -- NULL for Google-only accounts
  google_id   TEXT UNIQUE, -- NULL for credentials-only accounts
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
