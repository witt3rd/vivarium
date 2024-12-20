"use client";

import { Conversation } from "@/components/conversation";
import { SystemPrompts } from "@/components/system-prompts";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const [view, setView] = useState<"conversation" | "system-prompts">(
    "conversation"
  );

  return (
    <main>
      <div className="fixed top-0 left-0 right-0 p-4 bg-background border-b flex justify-center space-x-4">
        <Button
          variant={view === "conversation" ? "default" : "outline"}
          onClick={() => setView("conversation")}
        >
          Conversation
        </Button>
        <Button
          variant={view === "system-prompts" ? "default" : "outline"}
          onClick={() => setView("system-prompts")}
        >
          System Prompts
        </Button>
      </div>
      <div className="pt-16">
        {view === "conversation" ? <Conversation /> : <SystemPrompts />}
      </div>
    </main>
  );
}
