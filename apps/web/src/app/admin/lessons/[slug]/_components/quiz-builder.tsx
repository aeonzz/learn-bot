"use client";

import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Loader2,
  ClipboardList,
  GripVertical,
  CirclePlus,
  CircleMinus,
} from "lucide-react";
import { toast } from "sonner";

interface QuestionDraft {
  text: string;
  options: { text: string; isCorrect: boolean }[];
}

function emptyQuestion(): QuestionDraft {
  return {
    text: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

export function QuizBuilder({ lessonId }: { lessonId: string }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    emptyQuestion(),
  ]);

  const { data: quizzes, isLoading } = useQuery(
    trpc.quiz.listByLesson.queryOptions({ lessonId }),
  );

  const createMutation = useMutation(
    trpc.quiz.create.mutationOptions({
      onSuccess: () => {
        toast.success("Quiz created successfully");
        setIsCreating(false);
        resetForm();
        queryClient.invalidateQueries(
          trpc.quiz.listByLesson.queryFilter({ lessonId }),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.quiz.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Quiz deleted");
        queryClient.invalidateQueries(
          trpc.quiz.listByLesson.queryFilter({ lessonId }),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  function resetForm() {
    setTitle("");
    setQuestions([emptyQuestion()]);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestionText(index: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, text } : q)),
    );
  }

  function addOption(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: [...q.options, { text: "", isCorrect: false }] }
          : q,
      ),
    );
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.filter((_, j) => j !== oIndex) }
          : q,
      ),
    );
  }

  function updateOptionText(qIndex: number, oIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIndex ? { ...o, text } : o,
              ),
            }
          : q,
      ),
    );
  }

  function setCorrectOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => ({
                ...o,
                isCorrect: j === oIndex,
              })),
            }
          : q,
      ),
    );
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }
      if (q.options.some((o) => !o.text.trim())) {
        toast.error(`Question ${i + 1} has empty options`);
        return;
      }
      if (!q.options.some((o) => o.isCorrect)) {
        toast.error(`Question ${i + 1} needs a correct answer`);
        return;
      }
    }

    createMutation.mutate({
      lessonId,
      title: title.trim(),
      questions: questions.map((q, i) => ({
        text: q.text.trim(),
        orderIndex: i,
        options: q.options.map((o) => ({
          text: o.text.trim(),
          isCorrect: o.isCorrect,
        })),
      })),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardList className="h-4 w-4" />
          <h3 className="font-semibold text-xs uppercase tracking-widest">
            Quizzes
          </h3>
        </div>
        <Dialog
          open={isCreating}
          onOpenChange={(open) => {
            setIsCreating(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <Plus className="h-3 w-3" /> New Quiz
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Create Quiz</DialogTitle>
              <DialogDescription>
                Add questions with multiple-choice answers. Mark the correct
                answer for each question.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 px-1 -mx-1 py-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Quiz Title
                </label>
                <Input
                  placeholder="E.g. Chapter 1 Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-4">
                {questions.map((question, qIndex) => (
                  <Card key={qIndex} className="border-dashed relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="text-xs font-bold">
                            Q{qIndex + 1}
                          </span>
                        </div>
                        <Input
                          placeholder="Enter your question..."
                          value={question.text}
                          onChange={(e) =>
                            updateQuestionText(qIndex, e.target.value)
                          }
                          className="flex-1"
                          autoComplete="off"
                        />
                        {questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Options (select the correct answer)
                      </label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Checkbox
                            checked={option.isCorrect}
                            onCheckedChange={() =>
                              setCorrectOption(qIndex, oIndex)
                            }
                          />
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option.text}
                            onChange={(e) =>
                              updateOptionText(qIndex, oIndex, e.target.value)
                            }
                            className="flex-1"
                            autoComplete="off"
                          />
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <CircleMinus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {question.options.length < 6 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => addOption(qIndex)}
                        >
                          <CirclePlus className="h-3 w-3" /> Add Option
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={addQuestion}
                >
                  <Plus className="h-4 w-4" /> Add Question
                </Button>
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Create Quiz"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{quiz.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {quiz._count.questions} question
                  {quiz._count.questions !== 1 ? "s" : ""}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &ldquo;{quiz.title}&rdquo;
                      and all its questions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate({ id: quiz.id })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground mt-2">
            No quizzes yet. Create one to get started.
          </p>
        </div>
      )}
    </div>
  );
}
