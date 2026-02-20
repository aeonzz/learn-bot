"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentHomePage() {
  const { data: lessons, isLoading } = useQuery(
    trpc.lesson.list.queryOptions(),
  );

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Available Lessons</h1>
        <p className="text-muted-foreground">
          Explore and master your interactive learning materials.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse pt-0 border">
                <div className="h-24 bg-muted rounded-t-xl" />
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-2" />
                </CardHeader>
              </Card>
            ))
          : lessons?.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.slug}`}>
                <Card className="group hover:border-primary/50 transition-all pt-0 cursor-pointer overflow-hidden border">
                  <div className="h-24 bg-linear-to-br from-primary/10 to-primary/5 p-4 flex items-end justify-between">
                    <div className="bg-background p-2 rounded-lg shadow-sm">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border">
                        <AvatarImage src={lesson.teacher.image || ""} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {lesson.teacher.name}
                      </span>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      {lesson.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-10">
                      {lesson.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span className="font-medium text-primary/80 uppercase tracking-wider text-[10px]">
                        Interactive PDF
                      </span>
                      <span>
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>
      {!isLoading && (lessons?.length === 0 || !lessons) && (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No lessons available</h3>
          <p className="text-muted-foreground">
            Check back later for new learning materials.
          </p>
        </div>
      )}
    </div>
  );
}
