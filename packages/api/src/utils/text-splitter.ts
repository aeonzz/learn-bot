/**
 * Simple text splitter that splits text into chunks of a given size with some overlap.
 */
export function splitText(
  text: string,
  chunkSize = 500,
  overlap = 50,
): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));

    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}
