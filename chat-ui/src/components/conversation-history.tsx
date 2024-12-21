import type { Conversation } from "@/api/models/Conversation";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface ConversationHistoryProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  disableNew?: boolean;
  className?: string;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function ConversationHistory({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onNew,
  disableNew = false,
  className,
  isCollapsed = false,
  onCollapsedChange,
}: ConversationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    (conv.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (conv: Conversation) => {
    if (conv.id) {
      onSelect(conv.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    if (conv.id) {
      onDelete(conv.id);
    }
  };

  return (
    <div
      className={cn(
        "bg-card transition-all duration-300 ease-in-out overflow-hidden rounded-l-xl",
        isCollapsed ? "w-[32px]" : "w-[400px]",
        className
      )}
    >
      <div className="flex h-full">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[32px]" : "w-[400px]"
          )}
        >
          <div className="h-full flex">
            <div className="flex-none py-4 px-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCollapsedChange?.(!isCollapsed)}
                className="h-6 w-6"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronLeft className="h-3 w-3" />
                )}
              </Button>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <CardHeader className="pb-2 px-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">History</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onNew}
                      className="h-8 w-8"
                      disabled={disableNew}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-2 w-full"
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="px-2 space-y-1">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            "flex items-center gap-2 rounded-md hover:bg-accent py-1 pr-2 pl-1",
                            selectedId === conv.id ? "bg-accent" : ""
                          )}
                        >
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleSelect(conv)}
                          >
                            <div className="font-medium truncate">
                              {conv.name || "Untitled"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(conv.messages?.length || 0) +
                                (conv.system_prompt_id ? 1 : 0)}{" "}
                              messages
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, conv)}
                            className="h-6 w-6 p-0 flex-none ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
