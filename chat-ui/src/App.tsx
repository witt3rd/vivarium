"use client";

import { Conversation as ConversationType } from "@/api/models/Conversation";
import { ConversationsService } from "@/api/services/ConversationsService";
import { Conversation } from "@/components/conversation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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

function App() {
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [panels, setPanels] = useState<string[]>(["main"]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div
            className="flex gap-4 p-2 min-h-0 h-full"
            style={{ width: `max(100%, ${panels.length * 700}px)` }}
          >
            <SortableContext
              items={panels}
              strategy={horizontalListSortingStrategy}
            >
              {panels.map((id) => (
                <div key={id} className="flex-1 min-w-[700px]">
                  <Conversation
                    id={id}
                    conversations={conversations}
                    onConversationsChange={setConversations}
                    onRemove={removePanel}
                    showCloseButton={panels.length > 1}
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        </div>
      </DndContext>
    </div>
  );
}

export default App;
