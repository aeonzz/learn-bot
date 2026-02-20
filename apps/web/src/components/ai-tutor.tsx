"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AiTutorProps {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string | null;
}

export function AiTutor({
  lessonId,
  lessonTitle,
  lessonDescription,
}: AiTutorProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
      body: {
        lessonId,
        lessonContext: {
          title: lessonTitle,
          description: lessonDescription,
        },
      },
    }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming") return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed bottom-8 right-8 rounded-full h-14 w-14 shadow-2xl z-50 group"
          >
            <Bot className="h-6 w-6 group-hover:hidden" />
            <Sparkles className="h-6 w-6 hidden group-hover:block animate-pulse" />
          </Button>
        }
      />
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex flex-col text-left">
              <SheetTitle className="text-lg font-black uppercase tracking-tight">
                AI Tutor
              </SheetTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Expert Active for {lessonTitle}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 p-4 overflow-y-auto bg-card">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8 text-sm">
                Ask me anything about this lesson!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-[10px] font-bold">
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted border rounded-tl-none text-foreground"
                    }`}
                  >
                    {message.parts?.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <Streamdown
                            key={index}
                            isAnimating={
                              status === "streaming" &&
                              message.role === "assistant"
                            }
                          >
                            {part.text}
                          </Streamdown>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about this lesson..."
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={status === "streaming" || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
