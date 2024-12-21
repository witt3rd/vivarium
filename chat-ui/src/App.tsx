"use client";

import { Conversation as ConversationType } from "@/api/models/Conversation";
import { ConversationsService } from "@/api/services/ConversationsService";
import { Conversation } from "@/components/conversation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

function App() {
  const [conversations, setConversations] = useState<ConversationType[]>([]);

  // Load initial conversations
  useEffect(() => {
    const init = async () => {
      try {
        const convs =
          await ConversationsService.getConversationsConversationsGet();
        setConversations(convs);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };
    init();
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex h-full gap-4 p-4">
        <div className="flex-1 min-w-0">
          <Conversation
            conversations={conversations}
            onConversationsChange={setConversations}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Conversation
            conversations={conversations}
            onConversationsChange={setConversations}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
