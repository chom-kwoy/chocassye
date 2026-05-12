-- Run once to create bookmark tables.
-- psql -U postgres -d chocassye -f scripts/create_bookmarks_tables.sql

CREATE TABLE IF NOT EXISTS bookmark_categories (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sentence_id INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES bookmark_categories(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, sentence_id, category_id)
);
