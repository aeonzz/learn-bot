"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 flex justify-center">
      <div className="container flex h-14 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-lg shadow-primary/20">
              <BookOpen className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Learn Bot</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
