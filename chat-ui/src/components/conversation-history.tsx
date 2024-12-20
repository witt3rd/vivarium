import type { Conversation } from "@/api/models/Conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface ConversationHistoryProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  disableNew?: boolean;
}

export function ConversationHistory({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onNew,
  disableNew = false,
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
    <Card className="h-full w-[250px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">History</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNew}
            className="h-8 w-8"
            disabled={disableNew}
            title={
              disableNew
                ? "Please use the current empty conversation"
                : "New conversation"
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)] px-4">
          <div className="space-y-2 pr-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group ${
                  selectedId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => handleSelect(conv)}
              >
                <div className="truncate flex-1">
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
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(e, conv)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
