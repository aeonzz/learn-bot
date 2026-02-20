"use client";

import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Loader2, Plus, BookOpen, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { X, Upload } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: lessons, isLoading: isLoadingLessons } = useQuery(
    trpc.lesson.list.queryOptions(),
  );

  const createMutation = useMutation(
    trpc.lesson.create.mutationOptions({
      onSuccess: () => {
        toast.success("Lesson created successfully");
        setIsCreating(false);
        queryClient.invalidateQueries(trpc.lesson.list.queryFilter());
        form.reset();
        setIsLoading(false);
      },
      onError: (error) => {
        setIsLoading(false);
        toast.error(error.message);
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      slug: "",
      files: [] as File[],
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.files.length === 0) {
          toast.error("Please upload a lesson document");
          return;
        }

        setIsLoading(true);

        let documentUrl = "";

        const formData = new FormData();
        for (const file of value.files) {
          formData.append("file", file);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          setIsLoading(false);
          throw new Error(errorData.error || "Failed to upload file");
        }

        const { files } = await res.json();
        const firstFile = files[0];
        documentUrl = firstFile?.url || "";
        const content = firstFile?.content || "";

        createMutation.mutate({
          title: value.title,
          description: value.description,
          slug: value.slug,
          documentUrl: documentUrl,
          content: content,
        });
      } catch (error) {
        setIsLoading(false);
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        );
      }
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(1, "Title is required"),
        slug: z
          .string()
          .min(1, "Slug is required")
          .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
        description: z.string(),
        files: z.array(z.any()),
      }),
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your lessons and educational materials.
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger render={<Button />}>
            <Plus /> New Lesson
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
              <DialogDescription>
                Fill in the details for your new interactive lesson.
              </DialogDescription>
            </DialogHeader>
            <form
              id="create-lesson-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto px-1 -mx-1"
            >
              <FieldGroup>
                <form.Field name="title">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
                        placeholder="E.g. Introduction to Quantum Physics"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        autoComplete="off"
                        onChange={(e) => {
                          const title = e.target.value;
                          field.handleChange(title);
                          form.setFieldValue(
                            "slug",
                            title
                              .toLowerCase()
                              .replace(/ /g, "-")
                              .replace(/[^\w-]+/g, ""),
                          );
                        }}
                      />
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-red-500 text-xs"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <form.Field name="slug">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                      <Input
                        id={field.name}
                        placeholder="introduction-to-quantum-physics"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        autoComplete="off"
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-red-500 text-xs"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Description (Optional)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        placeholder="A brief overview of the lesson..."
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        autoComplete="off"
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-red-500 text-xs"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <form.Field name="files">
                  {(field) => (
                    <Field>
                      <FieldLabel>Lesson Materials</FieldLabel>
                      <FileUpload
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        maxFiles={1}
                        maxSize={5 * 1024 * 1024} // 5MB
                        accept=".pdf"
                      >
                        <FileUploadDropzone className="py-10">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center rounded-full border p-2.5">
                              <Upload className="size-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-sm">
                              Drag & drop lesson document
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Support for PDF only (max 1 file)
                            </p>
                          </div>
                          <FileUploadTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 w-fit"
                            >
                              Browse file
                            </Button>
                          </FileUploadTrigger>
                        </FileUploadDropzone>
                        <FileUploadList>
                          {field.state.value.map((file: File) => (
                            <FileUploadItem key={file.name} value={file}>
                              <FileUploadItemPreview />
                              <FileUploadItemMetadata />
                              <FileUploadItemDelete asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                >
                                  <X />
                                </Button>
                              </FileUploadItemDelete>
                            </FileUploadItem>
                          ))}
                        </FileUploadList>
                      </FileUpload>
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            </form>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Close</Button>} />
              <form.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    form="create-lesson-form"
                    disabled={
                      !state.canSubmit || state.isSubmitting || isLoading
                    }
                  >
                    {state.isSubmitting || isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Create Lesson"
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoadingLessons
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse pt-0">
                <div className="h-40 bg-muted rounded-t-xl" />
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-2" />
                </CardHeader>
              </Card>
            ))
          : lessons?.map((lesson) => (
              <Link key={lesson.id} href={`/admin/lessons/${lesson.slug}`}>
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
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {lesson.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Slug: {lesson.slug}</span>
                      <span>
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>
      {!isLoadingLessons && lessons?.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No lessons found</h3>
          <p className="text-muted-foreground">
            Get started by creating your first lesson above.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setIsCreating(true)}
          >
            <Plus /> Create Lesson
          </Button>
        </div>
      )}
    </div>
  );
}
