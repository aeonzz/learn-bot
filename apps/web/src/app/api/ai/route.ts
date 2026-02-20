import { createHuggingFace } from "@ai-sdk/huggingface";
import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  wrapLanguageModel,
  type LanguageModel,
} from "ai";
import { env } from "@learn-bot/env/server";
import prisma from "@learn-bot/db";
import { generateEmbedding } from "@learn-bot/api/utils/embeddings";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    lessonId,
    lessonContext,
  }: {
    messages: UIMessage[];
    lessonId?: string;
    lessonContext?: { title: string; description?: string };
  } = await req.json();

  const huggingface = createHuggingFace({
    apiKey: env.HUGGINGFACE_API_KEY,
  });

  const baseModel = huggingface("deepseek-ai/DeepSeek-V3-0324");

  let model: LanguageModel = baseModel;
  if (process.env.NODE_ENV === "development") {
    const { devToolsMiddleware } = await import("@ai-sdk/devtools");
    model = wrapLanguageModel({
      model: baseModel,
      middleware: devToolsMiddleware(),
    });
  }

  let context = "";

  // 1. If lessonId is provided, perform RAG retrieval
  if (lessonId) {
    try {
      const lastMessage = messages[messages.length - 1];
      const queryText =
        lastMessage?.parts
          ?.filter((p) => p.type === "text")
          .map((p) => (p as any).text)
          .join(" ") || "";

      if (queryText) {
        const queryVector = await generateEmbedding(queryText);

        // Semantic search using pgvector cosine distance (<=>)
        const relevantChunks = await prisma.$queryRawUnsafe<
          { content: string }[]
        >(
          `SELECT content FROM lesson_chunk 
           WHERE "lessonId" = $1 
           ORDER BY embedding <=> $2::vector 
           LIMIT 3`,
          lessonId,
          JSON.stringify(queryVector),
        );

        if (relevantChunks.length > 0) {
          context =
            "Relevant context from the lesson:\n\n" +
            relevantChunks
              .map((c: { content: string }) => `- ${c.content}`)
              .join("\n\n");
        }
      }
    } catch (error) {
      console.error("RAG Retrieval error:", error);
      // Fallback to basic context if RAG fails
    }
  }

  const systemPrompt = lessonContext
    ? `You are a helpful AI Tutor for the lesson: "${lessonContext.title}". 
       Description: ${lessonContext.description || "No description provided."}
       ${context ? `\n\n${context}` : ""}
       Your goal is to help students understand the material. Be encouraging, precise, and educational.`
    : "You are a helpful AI Tutor. Help the student understand their learning material.";

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
