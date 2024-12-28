"use client";

import { ConversationMetadata } from "@/api/models/ConversationMetadata";
import { ConversationsService } from "@/api/services/ConversationsService";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Conversation } from "./components/conversation";

export default function App() {
  const [conversations, setConversations] = useState<ConversationMetadata[]>(
    []
  );
  const [panels, setPanels] = useState<string[]>(["main"]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const conversations =
        await ConversationsService.getMetadataListApiConversationsGet();
      setConversations(conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPanels((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNewPanel = () => {
    setPanels((panels) => [...panels, crypto.randomUUID()]);
  };

  const handleClosePanel = (id: string) => {
    setPanels((panels) => panels.filter((panel) => panel !== id));
  };

  const handleConversationsChange = (metadata: ConversationMetadata[]) => {
    setConversations(
      metadata.map((m) => {
        const existing = conversations.find((c) => c.id === m.id);
        if (existing && JSON.stringify(existing) !== JSON.stringify(m)) {
          return { ...m, updated_at: new Date().toISOString() };
        }
        return m;
      })
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background crt">
      <Toaster />
      <div className="flex-none flex justify-between items-center p-2">
        <h1 className="font-mono text-primary text-xl tracking-wider font-bold uppercase">
          Vivarium
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewPanel}
            className="h-5 w-5"
            title="Add new panel"
          >
            <Plus className="text-muted-foreground scale-75 transform" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <main className="flex-1 overflow-x-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className="flex gap-4 p-2 min-h-0 h-full"
            style={{ width: `max(100%, ${panels.length * 900}px)` }}
          >
            <SortableContext
              items={panels}
              strategy={horizontalListSortingStrategy}
            >
              {panels.map((id) => (
                <div key={id} className="flex-1 min-w-[900px]">
                  <Conversation
                    id={id}
                    conversations={conversations}
                    onConversationsChange={handleConversationsChange}
                    onRemove={handleClosePanel}
                    showCloseButton={panels.length > 1}
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </main>
    </div>
  );
}
