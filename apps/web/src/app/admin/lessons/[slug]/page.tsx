"use client";

import { trpc } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
  { ssr: false },
);
import {
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  BookOpen,
  Info,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ZoomIn,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import { QuizBuilder } from "./_components/quiz-builder";

export default function LessonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const {
    data: lesson,
    isLoading,
    error,
  } = useQuery(trpc.lesson.getBySlug.queryOptions({ slug }));

  const deleteMutation = useMutation(
    trpc.lesson.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Lesson deleted successfully");
        router.push("/admin");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete lesson");
      },
    }),
  );

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <p className="text-muted-foreground">
          The lesson you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const docs = lesson.documentUrl
    ? [{ uri: window.location.origin + lesson.documentUrl }]
    : [];

  return (
    <div className="flex flex-row h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 bg-muted/20 overflow-hidden flex flex-col border-r relative h-full">
        {lesson?.documentUrl ? (
          <div className="flex-1 overflow-auto flex flex-col items-center bg-muted/30 p-4 md:p-8 custom-scrollbar">
            <div className="shadow-2xl border bg-white max-w-full">
              <PdfViewer
                url={lesson.documentUrl}
                scale={scale}
                pageNumber={pageNumber}
                onLoadSuccess={onDocumentLoadSuccess}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 bg-background">
            <div className="bg-primary/10 p-8 rounded-full mb-4">
              <BookOpen className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">No document attached</h2>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              This lesson doesn't have an attached document to display.
            </p>
          </div>
        )}
      </div>

      <aside className="w-95 flex flex-col bg-background shrink-0">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate tracking-tight">
              {lesson.title}
            </h1>
          </div>
          <div className="space-x-1.5">
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={
                <a href={lesson.documentUrl || "#"} download>
                  <Download />
                </a>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the lesson &ldquo;{lesson.title}&rdquo;
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ slug })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Lesson"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {numPages && (
          <div className="px-4 py-3 bg-muted/10 border-b flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> Navigation
              </span>
              <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border">
                {pageNumber} / {numPages}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 shadow-sm"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 shadow-sm"
                disabled={pageNumber >= (numPages || 1)}
                onClick={() =>
                  setPageNumber(Math.min(numPages || 1, pageNumber + 1))
                }
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Separator className="bg-border/50" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ZoomIn className="h-3 w-3" /> Zoom Level
              </span>
              <span className="text-[10px] font-mono">
                {Math.round(scale * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9 h-9 w-9 shadow-sm"
                onClick={() => setScale(Math.max(0.4, scale - 0.2))}
                disabled={scale <= 0.4}
              >
                <Minus />
              </Button>
              <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${((scale - 0.4) / (2.0 - 0.4)) * 100}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-9 h-9 w-9 shadow-sm"
                onClick={() => setScale(Math.min(2.0, scale + 0.2))}
                disabled={scale >= 2.0}
              >
                <Plus />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Lesson Overview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Info />
                <h3 className="font-semibold text-xs uppercase tracking-widest">
                  Lesson Overview
                </h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  &ldquo;{lesson.description || "No description provided."}
                  &rdquo;
                </p>
                <div className="flex items-center gap-3 py-3 border-y border-dashed">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={lesson.teacher.image || ""} />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-none">
                      {lesson.teacher.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase mt-1">
                      Lead Instructor
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Data */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-primary">
                <Calendar />
                <h3 className="font-semibold text-xs uppercase tracking-widest">
                  Timeline
                </h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Published:</span>
                  <span className="font-mono">
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    Slug Identifier:
                  </span>
                  <span className="font-mono text-primary truncate ml-4">
                    {lesson.slug}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">File Format:</span>
                  <span className="font-mono uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    {lesson.documentUrl?.split(".").pop() || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quizzes */}
            <div className="space-y-4 pt-4">
              <QuizBuilder lessonId={lesson.id} />
            </div>

            {/* System Info */}
            <div className="p-4 rounded-xl border border-dashed text-center space-y-2">
              <div className="inline-flex items-center justify-center p-2 bg-muted rounded-full mb-1">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Teacher Mode Enabled
              </p>
              <p className="text-[11px] text-balance">
                Quickly review materials and verify your lesson configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-center gap-2 opacity-30">
            <span className="text-[9px] font-black tracking-[0.3em] uppercase">
              Learn-Bot Admin
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
