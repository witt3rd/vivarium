"use client";

import { Conversation as ConversationType } from "@/api/models/Conversation";
import { ConversationCreate } from "@/api/models/ConversationCreate";
import { Message } from "@/api/models/Message";
import { SystemPrompt } from "@/api/models/SystemPrompt";
import { ConversationsService } from "@/api/services/ConversationsService";
import { SystemPromptsService } from "@/api/services/SystemPromptsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortConversations } from "@/lib/conversation-sort";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Download,
  Edit2,
  GitBranch,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationHistory } from "./conversation-history";
import { MessageComponent } from "./message";
import { MessageInput, MessageInputHandle } from "./message-input";

export function Conversation({
  conversations,
  onConversationsChange,
  id,
  onRemove,
  showCloseButton,
}: {
  conversations: ConversationType[];
  onConversationsChange: (conversations: ConversationType[]) => void;
  id: string;
  onRemove?: (id: string) => void;
  showCloseButton?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);

  // Initialize and handle conversation changes
  useEffect(() => {
    if (conversations.length > 0) {
      if (!currentId) {
        const [newestConversation] = sortConversations(conversations);
        setCurrentId(newestConversation.id);
      } else if (!conversations.find((c) => c.id === currentId)) {
        const [newestConversation] = sortConversations(conversations);
        setCurrentId(newestConversation.id);
      }
    }
  }, [conversations]); // Only run when conversations changes

  // UI state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isPreCached, setIsPreCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  const currentConversation = conversations.find((c) => c.id === currentId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScroll = useRef<boolean>(false);
  const messageInputRef = useRef<MessageInputHandle>(null);

  // Optimized state updates with proper types
  const updateConversations = useCallback(
    (updater: (prev: ConversationType[]) => ConversationType[]) => {
      onConversationsChange(updater(conversations));
    },
    [conversations, onConversationsChange]
  );

  // Memoized send handler
  const handleSend = useCallback(
    async (messageText: string) => {
      if (!currentId || !messageText.trim()) return;

      try {
        shouldAutoScroll.current = true; // Set flag before sending
        setLoading(true);
        setError(null);

        // Clean up any empty conversations except current one
        const emptyConvs = conversations.filter(
          (c) => c.id !== currentId && isEmptyConversation(c)
        );

        // Delete empty conversations
        await Promise.all(
          emptyConvs.map(async (conv) => {
            if (conv.id) {
              try {
                await ConversationsService.removeConversationConversationsConversationIdDelete(
                  conv.id
                );
                updateConversations((prev) =>
                  prev.filter((c) => c.id !== conv.id)
                );
              } catch (err) {
                console.error("Error cleaning up empty conversation:", err);
              }
            }
          })
        );

        // Add user message to UI immediately
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: [{ type: "text", text: messageText }],
          timestamp: new Date().toISOString(),
          cache: isPreCached,
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsPreCached(false); // Reset cache flag after sending

        // Create assistant message with a single ID that will be used throughout
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: [{ type: "text", text: "", format: "markdown" }],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversations list with both messages in a single update
        updateConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? {
                  ...c,
                  messages: [
                    ...(c.messages || []),
                    userMessage,
                    assistantMessage,
                  ],
                }
              : c
          )
        );

        // Stream response
        const response = await fetch(
          `/api/conversations/${currentId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...userMessage,
              assistant_message_id: assistantMessageId, // Pass the ID to backend
            }),
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let responseText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                if (!data.trim().startsWith("{")) continue;

                const event = JSON.parse(data);

                switch (event.type) {
                  case "message_start":
                    if (event.message.role === "user") {
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const userMessageIndex = newMessages.findIndex(
                          (msg) =>
                            msg.role === "user" && msg.id === userMessage.id
                        );
                        if (userMessageIndex !== -1) {
                          newMessages[userMessageIndex] = {
                            ...newMessages[userMessageIndex],
                            id: event.message.id,
                          };
                        }
                        return newMessages;
                      });
                    } else {
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.role === "assistant") {
                          lastMessage.id = event.message.id;
                          lastMessage.usage = event.message.usage;
                        }
                        return newMessages;
                      });
                    }
                    break;

                  case "content_block_delta":
                    if (
                      event.delta?.type === "text_delta" &&
                      typeof event.delta.text === "string"
                    ) {
                      responseText += event.delta.text;
                      shouldAutoScroll.current = true; // Re-enable auto-scroll for each chunk

                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.role === "assistant") {
                          lastMessage.content = [
                            {
                              type: "text",
                              text: responseText,
                              format: "markdown",
                            },
                          ];
                        }
                        return newMessages;
                      });
                    }
                    break;
                }
              } catch (err) {
                console.error("Error processing event:", err);
                continue;
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Fetch the final message to get complete usage information
        const conversation =
          await ConversationsService.getConversationConversationsConversationIdGet(
            currentId
          );
        const finalMessage = conversation.messages?.find(
          (m: Message) => m.id === assistantMessageId
        );
        if (finalMessage) {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (
              lastMessage?.role === "assistant" &&
              lastMessage.id === finalMessage.id
            ) {
              lastMessage.usage = finalMessage.usage;
            }
            return newMessages;
          });
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentId, isPreCached, conversations, updateConversations]
  );

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("historyCollapsed");
    if (savedState) {
      setIsHistoryCollapsed(savedState === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("historyCollapsed", isHistoryCollapsed.toString());
  }, [isHistoryCollapsed]);

  // Scroll to bottom when messages change, but only when shouldAutoScroll is true
  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldAutoScroll.current = false;
    }
  }, [messages]);

  // Load system prompts
  useEffect(() => {
    SystemPromptsService.getSystemPromptsSystemPromptsGet()
      .then(setSystemPrompts)
      .catch((error: unknown) => {
        console.error("Error loading system prompts:", error);
      });
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentId) return;

    shouldAutoScroll.current = true; // Set flag before loading messages
    ConversationsService.getConversationConversationsConversationIdGet(
      currentId
    )
      .then(async (conv: ConversationType) => {
        if (conv.system_prompt_id) {
          const prompt =
            await SystemPromptsService.getSystemPromptSystemPromptsPromptIdGet(
              conv.system_prompt_id
            );
          setMessages([
            {
              id: conv.system_prompt_id,
              role: "system",
              content: [
                { type: "text", text: prompt.name },
                { type: "text", text: prompt.content },
              ],
              timestamp: new Date().toISOString(),
              cache: prompt.is_cached,
            },
            ...(conv.messages?.filter((m: Message) => m.role !== "system") ||
              []),
          ]);
        } else {
          setMessages(conv.messages || []);
        }
      })
      .catch((error: unknown) => {
        console.error("Error loading messages:", error);
        setError("Failed to load messages");
      });
  }, [currentId]);

  // Helper to determine if a conversation is empty
  const isEmptyConversation = (conv: ConversationType): boolean => {
    return !conv.messages || conv.messages.length === 0; // Simple check - just no messages
  };

  const handleNewConversation = async () => {
    try {
      const createParams: ConversationCreate = {
        name: "New Conversation",
        id: crypto.randomUUID(),
      };
      const conv =
        await ConversationsService.createConversationConversationsPost(
          createParams
        );
      if (conv.id) {
        updateConversations((prev) => [conv, ...prev]);
        setCurrentId(conv.id);
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation");
    }
  };

  const handleTitleEdit = async () => {
    if (!currentId || !editedTitle.trim()) return;

    try {
      const updated =
        await ConversationsService.updateConversationConversationsConversationIdPut(
          currentId,
          {
            name: editedTitle.trim(),
            system_prompt_id: currentConversation?.system_prompt_id ?? null,
            model: currentConversation?.model ?? "claude-3-5-sonnet-20241022",
            max_tokens: currentConversation?.max_tokens ?? 8192,
          }
        );
      updateConversations((prev) =>
        prev.map((c: ConversationType) => (c.id === currentId ? updated : c))
      );
      setIsEditingTitle(false);
    } catch (err) {
      console.error("Error updating title:", err);
      setError("Failed to update title");
    }
  };

  const handleSystemPromptChange = async (promptId: string | null) => {
    if (!currentId) return;

    try {
      const updated =
        await ConversationsService.updateConversationConversationsConversationIdPut(
          currentId,
          {
            name: currentConversation?.name ?? "New Conversation",
            system_prompt_id: promptId,
            model: currentConversation?.model ?? "claude-3-5-sonnet-20241022",
            max_tokens: currentConversation?.max_tokens ?? 8192,
          }
        );
      updateConversations((prev) =>
        prev.map((c) => (c.id === currentId ? updated : c))
      );

      if (promptId) {
        const prompt =
          await SystemPromptsService.getSystemPromptSystemPromptsPromptIdGet(
            promptId
          );
        setMessages([
          {
            id: promptId,
            role: "system",
            content: [
              { type: "text", text: prompt.name },
              { type: "text", text: prompt.content },
            ],
            timestamp: new Date().toISOString(),
            cache: prompt.is_cached,
          },
          ...messages.filter((m) => m.role !== "system"),
        ]);
      } else {
        setMessages(messages.filter((m) => m.role !== "system"));
      }
    } catch (err) {
      console.error("Error updating system prompt:", err);
      setError("Failed to update system prompt");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentId) return;

    // Check if this is a system prompt message
    const message = messages.find((m) => m.id === messageId);
    if (message?.role === "system") {
      // Confirm deletion
      if (
        !window.confirm("Are you sure you want to delete this system prompt?")
      ) {
        return;
      }

      try {
        const updated =
          await ConversationsService.updateConversationConversationsConversationIdPut(
            currentId,
            {
              name: currentConversation?.name ?? "New Conversation",
              system_prompt_id: null,
              model: currentConversation?.model ?? "claude-3-5-sonnet-20241022",
              max_tokens: currentConversation?.max_tokens ?? 8192,
            }
          );

        await SystemPromptsService.deleteSystemPromptSystemPromptsPromptIdDelete(
          messageId
        );

        setSystemPrompts((prev) => prev.filter((p) => p.id !== messageId));
        updateConversations((prev) =>
          prev.map((c) => (c.id === currentId ? updated : c))
        );
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        console.error("Error deleting system prompt:", err);
        setError("Failed to delete system prompt");
      }
      return;
    }

    // Handle regular message deletion
    try {
      await ConversationsService.deleteMessageConversationsConversationIdMessagesMessageIdDelete(
        currentId,
        messageId
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      updateConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? { ...c, messages: c.messages?.filter((m) => m.id !== messageId) }
            : c
        )
      );
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("Failed to delete message");
    }
  };

  const handleToggleCache = async (messageId: string) => {
    if (!currentId) return;

    // Check if this is a system prompt message
    const message = messages.find((m) => m.id === messageId);
    if (message?.role === "system") {
      try {
        const updatedPrompt =
          await SystemPromptsService.updateSystemPromptSystemPromptsPromptIdPut(
            messageId,
            {
              is_cached: !message.cache,
            }
          );

        // Update messages state to reflect the change
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, cache: updatedPrompt.is_cached }
              : msg
          )
        );
      } catch (err) {
        console.error("Error toggling system prompt cache:", err);
        setError("Failed to toggle system prompt cache");
      }
      return;
    }

    // Handle regular message cache toggle
    try {
      await ConversationsService.toggleMessageCacheConversationsConversationIdMessagesMessageIdCachePost(
        currentId,
        messageId
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, cache: !msg.cache } : msg
        )
      );
    } catch (err) {
      console.error("Error toggling message cache:", err);
      setError("Failed to toggle cache");
    }
  };

  const handleMessageEdit = async (editedMessage: Message) => {
    if (!currentId || !editedMessage.id) return;

    try {
      if (editedMessage.role === "system") {
        // System prompt update
        const updatedPrompt =
          await SystemPromptsService.updateSystemPromptSystemPromptsPromptIdPut(
            editedMessage.id,
            {
              name: editedMessage.content[0].text,
              content: editedMessage.content[1].text,
            }
          );

        // Update systemPrompts state for the dropdown
        setSystemPrompts((prev) =>
          prev.map((p) => (p.id === editedMessage.id ? updatedPrompt : p))
        );
      } else {
        // Regular message update
        await ConversationsService.updateMessageConversationsConversationIdMessagesMessageIdPut(
          currentId,
          editedMessage.id,
          editedMessage
        );
      }

      // Update messages state
      setMessages((prev) =>
        prev.map((msg) => (msg.id === editedMessage.id ? editedMessage : msg))
      );
    } catch (err) {
      console.error("Error updating message:", err);
      setError("Failed to update message");
    }
  };

  const handleNewSystemPrompt = async () => {
    try {
      const newPrompt =
        await SystemPromptsService.createSystemPromptSystemPromptsPost({
          name: "New System Prompt",
          content: "",
          is_cached: false,
        });
      setSystemPrompts((prev) => [...prev, newPrompt]);

      if (currentId) {
        handleSystemPromptChange(newPrompt.id);
      }
    } catch (err) {
      console.error("Error creating system prompt:", err);
      setError("Failed to create system prompt");
    }
  };

  const handleDownloadTranscript = async () => {
    if (!currentId) return;

    try {
      const text =
        await ConversationsService.getConversationMarkdownConversationsConversationIdMarkdownGet(
          currentId
        );

      // Create blob and download
      const blob = new Blob([text], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentConversation?.name || "conversation"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error("Error downloading transcript:", error);
      setError("Failed to download transcript");
    }
  };

  return (
    <Card
      className={`h-full flex flex-col ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex flex-1 min-h-0">
        <ConversationHistory
          className="border-r shadow-lg"
          conversations={conversations}
          selectedId={currentId}
          onSelect={setCurrentId}
          onDelete={async (id: string) => {
            try {
              await ConversationsService.removeConversationConversationsConversationIdDelete(
                id
              );
              updateConversations((prev) => prev.filter((c) => c.id !== id));
              if (currentId === id) {
                // Get sorted conversations before deletion
                const sortedConversations = sortConversations(conversations);
                const currentIndex = sortedConversations.findIndex(
                  (c) => c.id === id
                );
                // Get next conversation in sort order, or previous if at end
                const nextConversation =
                  sortedConversations[currentIndex + 1] ||
                  sortedConversations[currentIndex - 1];
                setCurrentId(nextConversation?.id || null);
                setMessages([]);
              }
            } catch (err) {
              console.error("Error deleting conversation:", err);
              setError("Failed to delete conversation");
            }
          }}
          onNew={handleNewConversation}
          isCollapsed={isHistoryCollapsed}
          onCollapsedChange={setIsHistoryCollapsed}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 m-0 p-0">
          <CardHeader className="p-2 flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditedTitle(e.target.value)
                  }
                  onBlur={handleTitleEdit}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleTitleEdit();
                    else if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="h-7 w-[300px]"
                  placeholder="Conversation Title"
                />
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer min-w-0">
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="truncate">
                      {currentId
                        ? currentConversation?.name || "Untitled"
                        : "No Conversation Selected"}
                    </CardTitle>
                    {currentId && (
                      <div className="text-3xs pt-0.5 text-muted-foreground truncate">
                        {currentId}
                      </div>
                    )}
                  </div>
                  {currentId && (
                    <Edit2
                      className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-none"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
              )}
              <div className="flex-1" />
              {currentId && messages.length > 0 && (
                <>
                  <div
                    {...attributes}
                    {...listeners}
                    className="h-6 w-6 cursor-grab active:cursor-grabbing hover:bg-accent rounded-sm flex items-center justify-center"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `/api/conversations/${currentId}/clone`,
                              {
                                method: "POST",
                              }
                            );
                            if (!response.ok)
                              throw new Error("Failed to clone conversation");
                            const clonedConv: ConversationType =
                              await response.json();
                            updateConversations((prev) => [
                              clonedConv,
                              ...prev,
                            ]);
                            setCurrentId(clonedConv.id);
                            setMessages(clonedConv.messages || []);
                          } catch (err) {
                            console.error("Error cloning conversation:", err);
                            setError("Failed to clone conversation");
                          }
                        }}
                        title="Clone conversation"
                      >
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleDownloadTranscript}
                        title="Download transcript"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    {showCloseButton && (
                      <>
                        <div className="w-2" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onRemove?.(id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-2 pt-2 flex-1 flex flex-col space-y-4 min-h-0 min-w-0">
            <div className="p-0 flex gap-2 items-center">
              <Select
                value={currentConversation?.system_prompt_id || "none"}
                onValueChange={(value: string) =>
                  handleSystemPromptChange(value === "none" ? null : value)
                }
              >
                <SelectTrigger className="h-5 text-2xs flex-shrink-0 w-48">
                  <SelectValue placeholder="Select System Prompt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-2xs">
                    No System Prompt
                  </SelectItem>
                  {systemPrompts
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((prompt) => (
                      <SelectItem
                        key={prompt.id}
                        value={prompt.id}
                        className="text-2xs"
                      >
                        {prompt.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewSystemPrompt}
                className="h-5 w-5"
              >
                <Plus className="text-muted-foreground scale-75 transform" />
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="p-0 h-5 w-5"
                onClick={() =>
                  messagesEndRef.current?.parentElement?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                ↑
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-2 min-h-0 [&_[data-radix-scroll-area-viewport]>div]:!block">
              <div className="space-y-4 w-full">
                {messages.map((msg, index) => (
                  <MessageComponent
                    key={msg.id || index}
                    message={msg}
                    onDelete={handleDeleteMessage}
                    isCached={msg.cache || false}
                    onCacheChange={handleToggleCache}
                    onEdit={handleMessageEdit}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 h-5 w-5"
                onClick={() =>
                  messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                ↓
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-2xs">
                {error}
              </div>
            )}

            <MessageInput
              ref={messageInputRef}
              onSend={async (newMessage) => {
                try {
                  await handleSend(newMessage);
                  messageInputRef.current?.clear();
                } catch (err) {
                  // Don't clear the input if sending failed
                  return;
                }
              }}
              isPreCached={isPreCached}
              onPreCacheChange={setIsPreCached}
              loading={loading}
            />
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
