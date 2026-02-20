"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTakerProps {
  lessonId: string;
}

type QuizData = {
  id: string;
  title: string;
  questions: {
    id: string;
    text: string;
    orderIndex: number;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  }[];
};

type QuizState = "select" | "taking" | "results";

export function QuizTaker({ lessonId }: QuizTakerProps) {
  const [quizState, setQuizState] = useState<QuizState>("select");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const { data: quizzes, isLoading: isLoadingList } = useQuery(
    trpc.quiz.listByLesson.queryOptions({ lessonId }),
  );

  const { data: activeQuiz, isLoading: isLoadingQuiz } = useQuery({
    ...trpc.quiz.getById.queryOptions({ id: selectedQuizId! }),
    enabled: !!selectedQuizId,
  });

  function startQuiz(quizId: string) {
    setSelectedQuizId(quizId);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizState("taking");
  }

  function selectAnswer(optionId: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: optionId }));
  }

  function goNext() {
    if (activeQuiz && currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  function goPrev() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }

  function submitQuiz() {
    setQuizState("results");
  }

  function resetQuiz() {
    setQuizState("select");
    setSelectedQuizId(null);
    setCurrentQuestion(0);
    setAnswers({});
  }

  function retakeQuiz() {
    setCurrentQuestion(0);
    setAnswers({});
    setQuizState("taking");
  }

  function getScore(): { correct: number; total: number } {
    if (!activeQuiz) return { correct: 0, total: 0 };
    let correct = 0;
    activeQuiz.questions.forEach((q, i) => {
      const selectedId = answers[i];
      const correctOption = q.options.find((o) => o.isCorrect);
      if (selectedId && correctOption && selectedId === correctOption.id) {
        correct++;
      }
    });
    return { correct, total: activeQuiz.questions.length };
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="lg"
            variant="outline"
            className="fixed bottom-8 right-24 rounded-full h-14 w-14 shadow-2xl z-50 group"
          >
            <ClipboardList className="h-6 w-6" />
          </Button>
        }
      />
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex flex-col text-left">
              <SheetTitle className="text-lg font-black uppercase tracking-tight">
                Quizzes
              </SheetTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Test Your Knowledge
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {quizState === "select" && (
            <div className="p-4 space-y-3">
              {isLoadingList ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : quizzes && quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => startQuiz(quiz.id)}
                    className="w-full text-left flex items-center justify-between rounded-xl border p-4 hover:bg-muted/40 transition-colors group"
                  >
                    <div>
                      <p className="font-semibold text-sm">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {quiz._count.questions} question
                        {quiz._count.questions !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))
              ) : (
                <div className="text-center py-12 space-y-2">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No quizzes available for this lesson yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {quizState === "taking" && activeQuiz && (
            <div className="flex flex-col h-full">
              {isLoadingQuiz ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="font-bold">{activeQuiz.title}</span>
                      <span className="font-mono">
                        {currentQuestion + 1} / {activeQuiz.questions.length}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {activeQuiz.questions.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            i === currentQuestion
                              ? "bg-primary"
                              : i < currentQuestion || answers[i]
                                ? "bg-primary/30"
                                : "bg-muted",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-4 flex-1">
                    <h3 className="text-base font-semibold mb-4 leading-relaxed">
                      {activeQuiz.questions[currentQuestion].text}
                    </h3>
                    <div className="space-y-2">
                      {activeQuiz.questions[currentQuestion].options.map(
                        (option) => (
                          <button
                            key={option.id}
                            onClick={() => selectAnswer(option.id)}
                            className={cn(
                              "w-full text-left rounded-xl border p-3.5 text-sm transition-all",
                              answers[currentQuestion] === option.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                                : "hover:bg-muted/40",
                            )}
                          >
                            {option.text}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goPrev}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    {currentQuestion === activeQuiz.questions.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={submitQuiz}
                        disabled={
                          Object.keys(answers).length <
                          activeQuiz.questions.length
                        }
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={goNext}
                        disabled={!answers[currentQuestion]}
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {quizState === "results" && activeQuiz && (
            <div className="p-4 space-y-6">
              {/* Score Card */}
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <p className="text-4xl font-black">
                    {getScore().correct}/{getScore().total}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.round((getScore().correct / getScore().total) * 100)}%
                    correct
                  </p>
                </div>
              </div>

              {/* Answer Review */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Review Answers
                </h4>
                {activeQuiz.questions.map((q, i) => {
                  const selectedId = answers[i];
                  const correctOption = q.options.find((o) => o.isCorrect);
                  const isCorrect = selectedId === correctOption?.id;

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "rounded-xl border p-3 space-y-2",
                        isCorrect
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-red-500/30 bg-red-500/5",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <p className="text-sm font-medium">{q.text}</p>
                      </div>
                      {!isCorrect && (
                        <p className="text-xs text-muted-foreground ml-6">
                          Correct answer:{" "}
                          <span className="font-medium text-green-600">
                            {correctOption?.text}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={retakeQuiz}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Retake
                </Button>
                <Button className="flex-1" onClick={resetQuiz}>
                  All Quizzes
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
