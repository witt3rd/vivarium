import type { ConversationMetadata } from "@/api/models/ConversationMetadata";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react";
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  // Get unique tags from all conversations
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    conversations.forEach((conv) => {
      conv.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [conversations]);

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    return tagSearchQuery
      ? allTags.filter((tag) =>
          tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
        )
      : allTags;
  }, [allTags, tagSearchQuery]);

  const filteredAndSortedConversations = useMemo(() => {
    const filtered = conversations.filter((conv) => {
      const matchesSearch = (conv.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => conv.tags?.includes(tag));
      return matchesSearch && matchesTags;
    });
    return sortConversations(filtered, sortOption);
  }, [conversations, searchQuery, sortOption, selectedTags]);

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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
                title="New conversation"
              >
                <Plus className="text-muted-foreground scale-75 transform" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-2 flex-1 flex flex-col space-y-4 min-h-0 min-w-0">
            <div className="p-0 flex flex-col gap-2">
              <SmallInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-5 flex-1"
              />
              <div className="flex gap-2 items-center">
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

                <Popover
                  open={isTagPopoverOpen}
                  onOpenChange={setIsTagPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 text-2xs gap-1 flex-1"
                    >
                      <Tags className="h-3 w-3" />
                      {selectedTags.length
                        ? `${selectedTags.length} selected`
                        : "Filter Tags"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" side="right">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search tags..."
                        className="h-7 text-2xs"
                        value={tagSearchQuery}
                        onValueChange={setTagSearchQuery}
                      />
                      <div className="relative">
                        <ScrollArea className="h-[200px]">
                          <CommandList>
                            <CommandGroup>
                              {filteredTags.length === 0 ? (
                                <div className="py-6 text-center text-2xs text-muted-foreground">
                                  {allTags.length === 0
                                    ? "No tags available"
                                    : "No matching tags"}
                                </div>
                              ) : (
                                filteredTags.map((tag) => (
                                  <CommandItem
                                    key={tag}
                                    onSelect={() => toggleTag(tag)}
                                    className="text-2xs cursor-pointer flex items-center gap-2"
                                  >
                                    <div
                                      className={cn(
                                        "h-3 w-3 border rounded-sm flex items-center justify-center",
                                        selectedTags.includes(tag)
                                          ? "bg-primary border-primary"
                                          : "border-muted"
                                      )}
                                    >
                                      {selectedTags.includes(tag) && (
                                        <Check className="h-2 w-2 text-primary-foreground" />
                                      )}
                                    </div>
                                    {tag}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </ScrollArea>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-2xs py-0 h-4 gap-1"
                    >
                      {tag}
                      <X
                        className="h-2 w-2 cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)] min-h-0">
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
                      <div className="text-3xs text-muted-foreground flex items-center gap-2">
                        <span>{conv.message_count} messages</span>
                        {conv.tags && conv.tags.length > 0 && (
                          <span>{conv.tags.length} tags</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, conv)}
                      className="h-3.5 w-3.5"
                      title="Delete conversation"
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
