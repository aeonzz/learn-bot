import { HfInference } from "@huggingface/inference";
import { env } from "@learn-bot/env/server";

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

// Initialize once
const hf = new HfInference(env.HUGGINGFACE_API_KEY);

/**
 * Generates an embedding for a piece of text using Hugging Face Inference API.
 * Uses sentence-transformers/all-MiniLM-L6-v2 (384 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
  });

  return response as number[];
}

/**
 * Generates embeddings for multiple pieces of text.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = await Promise.all(
    texts.map((text) => generateEmbedding(text))
  );

  return embeddings;
}