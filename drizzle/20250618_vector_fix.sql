CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE notes
  ALTER COLUMN vector_dense TYPE vector(3072) USING vector_dense::vector,
  ALTER COLUMN vector_sparse TYPE vector(1536) USING vector_sparse::vector;
