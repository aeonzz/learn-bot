import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../index";
import prisma from "@learn-bot/db";
import { splitText } from "../utils/text-splitter";
import { generateEmbedding, generateEmbeddings } from "../utils/embeddings";
import type { LessonChunk } from "@learn-bot/db";
import { randomUUID } from "crypto";

export const lessonRouter = router({
  list: publicProcedure.query(async () => {
    return await prisma.lesson.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
  }),
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const lesson = await prisma.lesson.findUnique({
        where: { slug: input.slug },
        include: {
          teacher: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      return lesson;
    }),
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        slug: z.string().min(1),
        content: z.string().optional(),
        documentUrl: z.string().optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.lesson.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new Error(
          "A lesson with this slug already exists. Please choose a different slug.",
        );
      }

      const lesson = await prisma.lesson.create({
        data: {
          title: input.title,
          description: input.description,
          slug: input.slug,
          content: input.content,
          documentUrl: input.documentUrl || null,
          teacherId: ctx.session.user.id,
        },
      });

      // If there's content, ingest it for RAG
      if (input.content) {
        console.log("Ingesting content for RAG, length:", input.content.length);
        try {
          const chunks = splitText(input.content);
          console.log(`Split into ${chunks.length} chunks`);
          if (chunks.length > 0) {
            console.log("Generating embeddings...");
            const embeddings = await generateEmbeddings(chunks);
            console.log("Embeddings generated successfully");

            // Raw SQL insertion for vector field
            for (let i = 0; i < chunks.length; i++) {
              const id = randomUUID();
              const content = chunks[i];
              const embedding = JSON.stringify(embeddings[i]);

              console.log(`Inserting chunk ${i + 1}/${chunks.length}...`);
              await prisma.$executeRawUnsafe(
                `INSERT INTO lesson_chunk (id, "lessonId", content, embedding) VALUES ($1, $2, $3, $4::vector)`,
                id,
                lesson.id,
                content,
                embedding,
              );
            }
            console.log("All chunks inserted successfully");
          }
        } catch (error) {
          console.error("Failed to ingest lesson content:", error);
          // Don't fail the whole creation if ingestion fails, but log it
        }
      }

      return lesson;
    }),
  ingest: adminProcedure
    .input(z.object({ lessonId: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      // Clear existing chunks
      await prisma.lessonChunk.deleteMany({
        where: { lessonId: input.lessonId },
      });

      const chunks = splitText(input.content);
      if (chunks.length === 0) return { count: 0 };

      const embeddings = await generateEmbeddings(chunks);

      for (let i = 0; i < chunks.length; i++) {
        const id = randomUUID();
        const content = chunks[i];
        const embedding = JSON.stringify(embeddings[i]);

        await prisma.$executeRawUnsafe(
          `INSERT INTO lesson_chunk (id, "lessonId", content, embedding) VALUES ($1, $2, $3, $4::vector)`,
          id,
          input.lessonId,
          content,
          embedding,
        );
      }

      return { count: chunks.length };
    }),
  delete: adminProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.lesson.delete({
        where: { slug: input.slug },
      });
    }),
  search: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const embedding = await generateEmbedding(input.query);
      const embeddingStr = JSON.stringify(embedding);

      return await prisma.$queryRawUnsafe<
        (LessonChunk & {
          lessonTitle: string;
          lessonSlug: string;
          similarity: number;
        })[]
      >(
        `SELECT lc.id, lc."lessonId", lc.content, lc."createdAt", 
         l.title as "lessonTitle", l.slug as "lessonSlug", 
         1 - (lc.embedding <=> $1::vector) as similarity
         FROM lesson_chunk lc
         JOIN lesson l ON lc."lessonId" = l.id
         ORDER BY similarity DESC
         LIMIT $2`,
        embeddingStr,
        input.limit,
      );
    }),
});
