-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store the knowledge base documents
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB, -- Stores title, source URL, etc.
  embedding vector(1536), -- 1536 dimensions for OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store user feedback on chat responses
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  rating INTEGER CHECK (rating IN (1, -1)), -- 1 for thumbs up, -1 for thumbs down
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster similarity search (IVFFlat or HNSW)
-- We use IVFFlat here for simplicity, but HNSW is better for scale.
-- Note: You need some data before creating an effective index, so we might add this later.
-- CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
