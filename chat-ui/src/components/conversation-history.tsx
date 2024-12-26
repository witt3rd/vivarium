import type { ConversationMetadata } from "@/api/models/ConversationMetadata";
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
import { sortConversations, SortOption } from "@/lib/conversation-sort";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";

interface ConversationHistoryProps {
  conversations: ConversationMetadata[];
  selectedId: string | null;
  onConversationChange: (id: string) => void;
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
  onConversationChange,
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
    const filtered = conversations.filter((conv) =>
      (conv.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortConversations(filtered, sortOption);
  }, [conversations, searchQuery, sortOption]);

  const handleSelect = (conv: ConversationMetadata) => {
    if (conv.id) {
      onConversationChange(conv.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, conv: ConversationMetadata) => {
    e.stopPropagation();
    if (conv.id) {
      onDelete(conv.id);
    }
  };

  return (
    <div
      className={cn(
        "bg-card transition-all duration-300 ease-in-out overflow-hidden rounded-l-xl relative",
        isCollapsed ? "w-[32px]" : "w-[300px]",
        className
      )}
    >
      <div className="absolute left-0 top-2 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange?.(!isCollapsed)}
          className="w-[32px] h-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="w-full h-full">
          <CardHeader className="p-3 flex flex-row items-center space-y-0">
            <div className="flex items-center gap-2 flex-1 min-w-0 pl-6 relative z-20">
              <div className="flex flex-col min-w-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Conversations
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNew}
                disabled={disableNew}
                className="h-5 w-5 relative z-20"
              >
                <Plus className="text-muted-foreground scale-75 transform" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-2 flex-1 flex flex-col space-y-4 min-h-0 min-w-0">
            <div className="p-0 flex gap-2 items-center">
              <SmallInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-5 flex-1"
              />
              <Select
                value={sortOption}
                onValueChange={(value) => setSortOption(value as SortOption)}
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
            <ScrollArea className="h-[calc(100vh-9rem)] min-h-0">
              <div className="space-y-0.5">
                {filteredAndSortedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center gap-1 hover:bg-accent py-0.5 px-2",
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
                        {conv.message_count} messages
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
  );
}
