"use client";

import { ConversationMetadata } from "@/api/models/ConversationMetadata";
import { ConversationsService } from "@/api/services/ConversationsService";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
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
import { Maximize2, Minimize2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Conversation } from "./components/conversation";

export default function App() {
  const [conversations, setConversations] = useState<ConversationMetadata[]>(
    []
  );
  const [panels, setPanels] = useState<string[]>(["main"]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-background crt",
        isFullscreen && "h-[100dvh]"
      )}
    >
      <Toaster />
      <div className="flex-none flex justify-between items-center p-1">
        <h1 className="font-mono text-primary text-xl tracking-wider font-bold uppercase">
          Vivarium
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewPanel}
            className="h-5 w-5 hover:bg-transparent group"
            title="Add new panel"
          >
            <Plus className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all scale-75 transform" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-5 w-5 hover:bg-transparent group"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all scale-75 transform" />
            ) : (
              <Maximize2 className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all scale-75 transform" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
              className="flex gap-4 p-1 h-full"
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
        </div>
      </div>
    </div>
  );
}
