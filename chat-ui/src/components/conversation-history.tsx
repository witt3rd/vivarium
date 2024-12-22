import type { Conversation } from "@/api/models/Conversation";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmallInput } from "@/components/ui/small-inputs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";

type SortOption = "new-to-old" | "old-to-new" | "a-to-z" | "z-to-a";

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
  const [sortOption, setSortOption] = useState<SortOption>("new-to-old");

  const filteredAndSortedConversations = useMemo(() => {
    const result = conversations.filter((conv) =>
      (conv.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortOption) {
      case "new-to-old":
        return [...result].sort((a, b) => {
          const aTime = new Date(a.updated_at || 0).getTime();
          const bTime = new Date(b.updated_at || 0).getTime();
          return bTime - aTime;
        });
      case "old-to-new":
        return [...result].sort((a, b) => {
          const aTime = new Date(a.updated_at || 0).getTime();
          const bTime = new Date(b.updated_at || 0).getTime();
          return aTime - bTime;
        });
      case "a-to-z":
        return [...result].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
      case "z-to-a":
        return [...result].sort((a, b) =>
          (b.name || "").localeCompare(a.name || "")
        );
      default:
        return result;
    }
  }, [conversations, searchQuery, sortOption]);

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
        isCollapsed ? "w-[32px]" : "w-[300px]",
        className
      )}
    >
      <div className="flex h-full">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[32px]" : "w-[300px]"
          )}
        >
          <div className="h-full flex">
            <div className="flex-none py-2 px-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCollapsedChange?.(!isCollapsed)}
                className="h-5 w-5"
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
                <CardHeader className="pb-2 px-2 space-y-1">
                  <div className="flex items-center justify-between -mt-[20px]">
                    <CardTitle className="text-xs font-medium">
                      Chat History
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onNew}
                      disabled={disableNew}
                    >
                      <Plus className="h-2.5 w-2.5 scale-75 transform" />
                    </Button>
                  </div>
                  <div className="flex gap-1 pt-2">
                    <SmallInput
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-5"
                    />
                    <Select
                      value={sortOption}
                      onValueChange={(value) =>
                        setSortOption(value as SortOption)
                      }
                    >
                      <SelectTrigger className="h-5 text-2xs flex-shrink-0 w-20">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-to-old" className="text-2xs">
                          Newest
                        </SelectItem>
                        <SelectItem value="old-to-new" className="text-2xs">
                          Oldest
                        </SelectItem>
                        <SelectItem value="a-to-z" className="text-2xs">
                          A to Z
                        </SelectItem>
                        <SelectItem value="z-to-a" className="text-2xs">
                          Z to A
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-9.5rem)]">
                    <div className="px-2 space-y-0.5">
                      {filteredAndSortedConversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            "flex items-center gap-1 rounded-sm hover:bg-accent py-0.5 pr-1 pl-1",
                            selectedId === conv.id ? "bg-accent" : ""
                          )}
                        >
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleSelect(conv)}
                          >
                            <div className="text-2xs truncate">
                              {conv.name || "Untitled"}
                            </div>
                            <div className="text-3xs text-muted-foreground">
                              {(conv.messages?.length || 0) +
                                (conv.system_prompt_id ? 1 : 0)}{" "}
                              messages
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(e, conv)}
                            className="h-3.5 w-3.5"
                          >
                            <Trash2 className="text-muted-foreground scale-75 transform" />
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
