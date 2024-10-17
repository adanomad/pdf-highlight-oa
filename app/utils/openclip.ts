import * as tf from '@tensorflow/tfjs';

// Fetch embedding from the Flask server
async function fetchEmbedding(type: 'text' | 'image', input: string) {
  const endpoint = type === 'text' ? '/embed-text' : '/embed-image';  // Match the correct API endpoint

  const response = await fetch(`http://localhost:5000${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(type === 'text' ? { text: input } : { image_url: input }), // Send the correct payload
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return tf.tensor(data.embedding);  // Return the embedding tensor
}

// Function to compute text embeddings using the Flask API
export const computeTextEmbedding = async (text: string) => {
  return fetchEmbedding('text', text);  // Pass 'text' type to the embedding fetcher
};

// Function to compute image embeddings using the Flask API
export const computeImageEmbedding = async (imageUrl: string) => {
  return fetchEmbedding('image', imageUrl);  // Pass 'image' type to the embedding fetcher
};

// Cosine similarity function to compare two embeddings
export const cosineSimilarity = (embeddingA: tf.Tensor, embeddingB: tf.Tensor) => {
  const normA = embeddingA.div(embeddingA.norm());  // Normalize the first embedding
  const normB = embeddingB.div(embeddingB.norm());  // Normalize the second embedding
  const similarity = normA.mul(normB).sum();  // Compute the cosine similarity
  return similarity.dataSync()[0];  // Return the similarity score
};
