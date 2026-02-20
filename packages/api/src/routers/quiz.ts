import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../index";
import prisma from "@learn-bot/db";

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1),
  orderIndex: z.number(),
  options: z.array(optionSchema).min(2),
});

export const quizRouter = router({
  listByLesson: publicProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.quiz.findMany({
        where: { lessonId: input.lessonId },
        include: {
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.quiz.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: {
              options: true,
            },
          },
        },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        lessonId: z.string(),
        title: z.string().min(1),
        questions: z.array(questionSchema).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.quiz.create({
        data: {
          lessonId: input.lessonId,
          title: input.title,
          questions: {
            create: input.questions.map((q) => ({
              text: q.text,
              orderIndex: q.orderIndex,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: { include: { options: true } },
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.quiz.delete({
        where: { id: input.id },
      });
    }),
});
