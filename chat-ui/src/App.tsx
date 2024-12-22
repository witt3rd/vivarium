"use client";

import { Conversation as ConversationType } from "@/api/models/Conversation";
import { ConversationsService } from "@/api/services/ConversationsService";
import { Conversation } from "@/components/conversation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

function App() {
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [panels, setPanels] = useState<string[]>(["main"]);

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

  const addPanel = () => {
    setPanels((prev) => [...prev, crypto.randomUUID()]);
  };

  const removePanel = (id: string) => {
    setPanels((prev) => prev.filter((p) => p !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-none flex justify-between items-center p-2">
        <h1 className="text-l font-semibold">Claude Chat</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={addPanel}
            className="h-5 w-5"
          >
            <Plus className="text-muted-foreground scale-75 transform" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <div className="flex-1 flex gap-4 p-2 min-h-0">
        {panels.map((id) => (
          <div key={id} className="flex-1 min-w-0 min-h-0 relative">
            {panels.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 z-10 h-6 w-6"
                onClick={() => removePanel(id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="h-full">
              <Conversation
                conversations={conversations}
                onConversationsChange={setConversations}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
