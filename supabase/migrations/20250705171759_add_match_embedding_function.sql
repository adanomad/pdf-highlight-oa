-- Function to match embeddings using cosine similarity; also threshold to not get irrelevant result
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id int,
  doc_id int,
  page_no int,
  chunk_no int,
  text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    embedding.id,
    embedding.doc_id,
    embedding.page_no,
    embedding.chunk_no,
    embedding.text,
    1 - (embedding.text_vec <=> query_embedding) as similarity
  FROM embedding
  WHERE 1 - (embedding.text_vec <=> query_embedding) > match_threshold
  ORDER BY embedding.text_vec <=> query_embedding
  LIMIT match_count;
END;
$$;