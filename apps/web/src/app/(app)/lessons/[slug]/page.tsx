"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ZoomIn,
  BookOpen,
  Maximize2,
  Minimize2,
  Download,
} from "lucide-react";
import { AiTutor } from "@/components/ai-tutor";
import { QuizTaker } from "@/components/quiz-taker";

export default function StudentLessonViewer() {
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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-bold animate-pulse uppercase tracking-widest text-muted-foreground">
            {" "}
            Preparing your lesson...
          </p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto p-12 text-center space-y-6">
        <div className="bg-destructive/10 p-6 rounded-full inline-block">
          <BookOpen className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">
            Access Denied or Not Found
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            We couldn't find the lesson you're looking for. It might have been
            removed or you don't have permission to view it.
          </p>
        </div>
        <Button
          onClick={() => router.push("/")}
          size="lg"
          className="rounded-full px-8 font-bold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Portal
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)]`}>
      <div className="h-16 px-6 border-b flex items-center justify-between bg-background backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-tight line-clamp-1">
              {lesson.title}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Studying Module
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-muted/50 rounded-full px-2 py-1 border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 text-xs font-black min-w-20 text-center">
            {pageNumber} <span className="text-muted-foreground">/</span>{" "}
            {numPages || "?"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={pageNumber >= (numPages || 1)}
            onClick={() =>
              setPageNumber(Math.min(numPages || 1, pageNumber + 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-full p-1 border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setScale(Math.max(0.4, scale - 0.2))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-[10px] font-bold w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setScale(Math.min(2.0, scale + 0.2))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="icon"
            className="rounded-full h-10 w-10 shadow-lg shadow-primary/20"
            render={
              <a href={lesson.documentUrl || "#"} download>
                <Download className="h-4 w-4" />
              </a>
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card p-4 md:p-12 flex flex-col items-center custom-scrollbar">
        <div className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border bg-white dark:bg-slate-950 rounded-sm">
          <PdfViewer
            url={lesson.documentUrl!}
            scale={scale}
            pageNumber={pageNumber}
            onLoadSuccess={onDocumentLoadSuccess}
          />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-xl border rounded-full px-4 py-2 flex items-center gap-6 shadow-2xl z-30">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-sm font-black">
            {pageNumber} <span className="opacity-20 mx-1">/</span>{" "}
            {numPages || "?"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
            disabled={pageNumber >= (numPages || 1)}
            onClick={() =>
              setPageNumber(Math.min(numPages || 1, pageNumber + 1))
            }
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <QuizTaker lessonId={lesson.id} />
      <AiTutor
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        lessonDescription={lesson.description}
      />
    </div>
  );
}
