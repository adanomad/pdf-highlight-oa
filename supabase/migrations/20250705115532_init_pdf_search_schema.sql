CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for embeddings

CREATE TABLE pdf (
  id           SERIAL PRIMARY KEY,           -- auto-incrementing PK
  filename     TEXT   NOT NULL,
  pages        INT,
  content_hash TEXT,                            -- SHA-256 for dedup (if time allows)
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE embedding (
  id        SERIAL PRIMARY KEY,              -- auto-incrementing PK
  doc_id    INT NOT NULL REFERENCES pdf(id) ON DELETE CASCADE,
  page_no   INT NOT NULL CHECK (page_no > 0),
  chunk_no  INT NOT NULL DEFAULT 0,          -- 0 = whole page, for potentially finer embeddings in future
  text      TEXT,
  text_vec  VECTOR(1536) NOT NULL              -- openai's text-embedding-3-small
);

-- ANN index for semantic search (cosine distance)
CREATE INDEX embedding_text_vec_ivfflat
  ON embedding
  USING ivfflat (text_vec vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX embedding_doc_page_chunk -- quick lookups
  ON embedding (doc_id, page_no, chunk_no);
