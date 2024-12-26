"use client";

import { ConversationMetadata } from "@/api/models/ConversationMetadata";
import { Message } from "@/api/models/Message";
import { MetadataCreate } from "@/api/models/MetadataCreate";
import { SystemPrompt } from "@/api/models/SystemPrompt";
import { ConversationsService } from "@/api/services/ConversationsService";
import { SystemPromptsService } from "@/api/services/SystemPromptsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  ChevronsDown,
  ChevronsUp,
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

// Define a type for the voice category
const categoryOrder: Record<string, number> = {
  cloned: 0,
  generated: 1,
  premade: 2,
};

// Add this helper function
const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot);
};

export function Conversation({
  conversations,
  onConversationsChange,
  id,
  onRemove,
  showCloseButton,
}: {
  conversations: ConversationMetadata[];
  onConversationsChange: (metadata: ConversationMetadata[]) => void;
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

  // Core state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);

  // UI state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isPreCached, setIsPreCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  // Add state variables for TTS controls
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  // Add a function to fetch and cache voices
  const [voices, setVoices] = useState<
    { voice_id: string; name: string; category: string }[]
  >([]);
  const [loadingVoices, setLoadingVoices] = useState<boolean>(false);

  // Add error state for fetching voices
  const [fetchError, setFetchError] = useState<boolean>(false);

  const currentMetadata = conversations.find((m) => m.id === currentId);

  // Add state for persona name and user name input
  const [localPersonaName, setLocalPersonaName] = useState<string>("");
  const [localUserName, setLocalUserName] = useState<string>("");
  const personaNameDebounceRef = useRef<NodeJS.Timeout>();
  const userNameDebounceRef = useRef<NodeJS.Timeout>();

  // Initialize local state when metadata changes
  useEffect(() => {
    if (currentMetadata) {
      setLocalPersonaName(currentMetadata.persona_name ?? "");
      setLocalUserName(currentMetadata.user_name ?? "");
    }
  }, [currentMetadata?.id]); // Only update when conversation changes

  const fetchVoices = useCallback(async () => {
    if (voices.length > 0 || loadingVoices || fetchError) return; // Use cached voices if available, if already loading, or if there's an error
    setLoadingVoices(true);
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        setFetchError(true);
        setError(
          `Failed to fetch voices: HTTP error! status: ${response.status}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: {
        voices: { voice_id: string; name: string; category: string }[];
      } = await response.json();
      setVoices(
        data.voices.map((voice) => ({
          voice_id: voice.voice_id,
          name: voice.name,
          category: voice.category || "premade",
        }))
      );
      setFetchError(false); // Reset error state on success
      setError(null); // Clear error message on success
    } catch (error) {
      console.error("Error fetching voices:", error);
      setVoices([]); // Ensure voices is always an array
      setError(
        "Failed to fetch voices. Please check your network connection and API key."
      );
    } finally {
      setLoadingVoices(false);
    }
  }, [voices, loadingVoices, fetchError]);

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

  const currentConversation = conversations.find((c) => c.id === currentId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScroll = useRef<boolean>(false);
  const messageInputRef = useRef<MessageInputHandle>(null);

  // Memoized send handler
  const handleSend = useCallback(
    async (messageText: string, files?: File[]) => {
      if (!currentId || !messageText.trim()) return;

      try {
        shouldAutoScroll.current = true;
        setLoading(true);
        setError(null);

        // Create message IDs
        const userMessageId = crypto.randomUUID();
        const assistantMessageId = crypto.randomUUID();

        // Create image metadata first if we have files
        const imageMetadata = files?.map((file) => {
          const id = crypto.randomUUID();
          const extension = getFileExtension(file.name);
          return {
            id,
            filename: `${id}${extension}`,
            media_type: file.type,
            originalFile: file,
          };
        });

        // Create the message data
        const messageData = {
          id: userMessageId,
          assistant_message_id: assistantMessageId,
          content: [{ type: "text", text: messageText }],
          cache: isPreCached,
        };

        // Add user message to UI immediately
        const userMessage: Message = {
          id: userMessageId,
          role: "user",
          content: [{ type: "text", text: messageText }],
          timestamp: new Date().toISOString(),
          cache: isPreCached,
          images: imageMetadata?.map(({ id, filename, media_type }) => ({
            id,
            filename,
            media_type,
          })),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsPreCached(false);

        // Create FormData and append message data and files
        const formData = new FormData();
        formData.append("id", messageData.id);
        formData.append(
          "assistant_message_id",
          messageData.assistant_message_id
        );
        formData.append("content", JSON.stringify(messageData.content));
        formData.append("cache", messageData.cache.toString());

        // Append files with their new filenames
        if (imageMetadata) {
          imageMetadata.forEach(({ filename, originalFile }) => {
            // Create a new File object with the UUID filename
            const renamedFile = new File([originalFile], filename, {
              type: originalFile.type,
            });
            formData.append("files", renamedFile);
          });
        }

        // Create assistant message placeholder
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: [{ type: "text", text: "", format: "markdown" }],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update metadata count for both messages atomically
        const updatedCount = (currentMetadata?.message_count ?? 0) + 2;
        onConversationsChange(
          conversations.map((c) =>
            c.id === currentId && currentMetadata
              ? {
                  ...currentMetadata,
                  message_count: updatedCount,
                }
              : c
          )
        );

        // Stream response
        const response = await fetch(
          `/api/conversations/${currentId}/messages`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          // If the server request fails, remove the messages
          setMessages((prev) =>
            prev.filter(
              (m) => m.id !== userMessageId && m.id !== assistantMessageId
            )
          );
          onConversationsChange(
            conversations.map((c) =>
              c.id === currentId
                ? { ...c, message_count: currentMetadata?.message_count ?? 0 }
                : c
            )
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle server response
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
                          newMessages[userMessageIndex] = event.message;
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
                      shouldAutoScroll.current = true;

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

        // Get final message state
        const messages =
          await ConversationsService.getMessagesApiConversationsConvIdMessagesGet(
            currentId
          );
        const finalMessage = messages.find((m) => m.id === assistantMessageId);
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
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message. Please try again.");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      currentId,
      isPreCached,
      conversations,
      currentMetadata,
      onConversationsChange,
    ]
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

  // Add a debounced scroll handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);

      // If we should auto scroll, set a new timeout
      if (shouldAutoScroll.current) {
        timeoutId = setTimeout(() => {
          const containerHeight =
            messagesEndRef.current?.parentElement?.scrollHeight ?? 0;

          // Only scroll and reset flag if we have actual content
          if (containerHeight > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            shouldAutoScroll.current = false;
          }
        }, 100);
      }
    });

    const messageContainer = messagesEndRef.current?.parentElement;
    if (messageContainer) {
      observer.observe(messageContainer);
    }

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messages.length]);

  // Load system prompts
  useEffect(() => {
    SystemPromptsService.getSystemPromptsApiSystemPromptsGet()
      .then(setSystemPrompts)
      .catch((error: unknown) => {
        console.error("Error loading system prompts:", error);
      });
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentId) return;

    // Messages are already cleared in handleConversationChange
    ConversationsService.getMessagesApiConversationsConvIdMessagesGet(currentId)
      .then(async (messages) => {
        if (currentMetadata?.system_prompt_id) {
          const prompt =
            await SystemPromptsService.getSystemPromptApiSystemPromptsPromptIdGet(
              currentMetadata.system_prompt_id
            );
          setMessages([
            {
              id: currentMetadata.system_prompt_id,
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
          setMessages(messages);
        }

        // Initialize audio settings from metadata
        setAudioEnabled(currentMetadata?.audio_enabled ?? false);
        setSelectedVoiceId(currentMetadata?.voice_id ?? null);
      })
      .catch((error: unknown) => {
        console.error("Error loading messages:", error);
        setError("Failed to load messages");
      });
  }, [
    currentId,
    currentMetadata?.system_prompt_id,
    currentMetadata?.audio_enabled,
    currentMetadata?.voice_id,
  ]);

  const handleNewConversation = async () => {
    try {
      const createParams: MetadataCreate = {
        name: "New Conversation",
        id: crypto.randomUUID(),
      };
      const metadata =
        await ConversationsService.createMetadataApiConversationsPost(
          createParams
        );
      if (metadata.id) {
        onConversationsChange([metadata, ...conversations]);
        setCurrentId(metadata.id);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError("Failed to create conversation");
    }
  };

  const handleTitleEdit = async () => {
    if (!currentId || !editedTitle.trim() || !currentMetadata) return;
    try {
      const updated =
        await ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
          currentId,
          {
            ...currentMetadata,
            name: editedTitle.trim(),
          }
        );
      onConversationsChange(
        conversations.map((c) => (c.id === currentId ? updated : c))
      );
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating title:", error);
      setError("Failed to update title");
    }
  };

  const handleSystemPromptChange = async (promptId: string | null) => {
    if (!currentId || !currentMetadata) return;
    try {
      const updated =
        await ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
          currentId,
          {
            ...currentMetadata,
            system_prompt_id: promptId,
          }
        );
      onConversationsChange(
        conversations.map((c) => (c.id === currentId ? updated : c))
      );

      if (promptId) {
        const prompt =
          await SystemPromptsService.getSystemPromptApiSystemPromptsPromptIdGet(
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
    } catch (error) {
      console.error("Error updating system prompt:", error);
      setError("Failed to update system prompt");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentId) return;

    // Check if this is a system prompt message
    const message = messages.find((m) => m.id === messageId);
    if (message?.role === "system") {
      if (
        !window.confirm("Are you sure you want to delete this system prompt?")
      ) {
        return;
      }

      try {
        const updated =
          await ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
            currentId,
            {
              name: currentMetadata?.name ?? "New Conversation",
              system_prompt_id: null,
              model: currentMetadata?.model ?? "claude-3-5-sonnet-20241022",
              max_tokens: currentMetadata?.max_tokens ?? 8192,
            }
          );

        await SystemPromptsService.deleteSystemPromptApiSystemPromptsPromptIdDelete(
          messageId
        );

        setSystemPrompts((prev) => prev.filter((p) => p.id !== messageId));
        onConversationsChange(
          conversations.map((c) => (c.id === currentId ? updated : c))
        );
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (error) {
        console.error("Error deleting system prompt:", error);
        setError("Failed to delete system prompt");
      }
      return;
    }

    // Handle regular message deletion
    try {
      // Optimistically update UI
      const previousMessages = messages;
      const previousCount = currentMetadata?.message_count ?? 0;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      onConversationsChange(
        conversations.map((c) =>
          c.id === currentId
            ? { ...c, message_count: Math.max(0, (c.message_count || 0) - 1) }
            : c
        )
      );

      try {
        await ConversationsService.deleteMessageApiConversationsConvIdMessagesMessageIdDelete(
          currentId,
          messageId
        );
      } catch (error) {
        // Rollback UI changes on error
        console.error("Error deleting message:", error);
        setError("Failed to delete message");
        setMessages(previousMessages);
        onConversationsChange(
          conversations.map((c) =>
            c.id === currentId ? { ...c, message_count: previousCount } : c
          )
        );
      }
    } catch (error) {
      console.error("Error in delete operation:", error);
      setError("Failed to delete message");
    }
  };

  const handleToggleCache = async (messageId: string) => {
    if (!currentId) return;

    const message = messages.find((m) => m.id === messageId);
    if (message?.role === "system") {
      try {
        const updatedPrompt =
          await SystemPromptsService.updateSystemPromptApiSystemPromptsPromptIdPut(
            messageId,
            {
              is_cached: !message.cache,
            }
          );
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, cache: updatedPrompt.is_cached }
              : msg
          )
        );
      } catch (error) {
        console.error("Error toggling system prompt cache:", error);
        setError("Failed to toggle system prompt cache");
      }
      return;
    }

    try {
      await ConversationsService.toggleMessageCacheApiConversationsConvIdMessagesMessageIdCachePost(
        currentId,
        messageId
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, cache: !msg.cache } : msg
        )
      );
    } catch (error) {
      console.error("Error toggling message cache:", error);
      setError("Failed to toggle cache");
    }
  };

  const handleMessageEdit = async (editedMessage: Message) => {
    if (!currentId || !editedMessage.id) return;

    try {
      if (editedMessage.role === "system") {
        const updatedPrompt =
          await SystemPromptsService.updateSystemPromptApiSystemPromptsPromptIdPut(
            editedMessage.id,
            {
              name: editedMessage.content[0].text,
              content: editedMessage.content[1].text,
            }
          );
        setSystemPrompts((prev) =>
          prev.map((p) => (p.id === editedMessage.id ? updatedPrompt : p))
        );
      } else {
        await ConversationsService.updateMessageApiConversationsConvIdMessagesMessageIdPut(
          currentId,
          editedMessage.id,
          editedMessage
        );
      }
      setMessages((prev) =>
        prev.map((msg) => (msg.id === editedMessage.id ? editedMessage : msg))
      );
    } catch (error) {
      console.error("Error updating message:", error);
      setError("Failed to update message");
    }
  };

  const handleNewSystemPrompt = async () => {
    try {
      const newPrompt =
        await SystemPromptsService.createSystemPromptApiSystemPromptsPost({
          name: "New System Prompt",
          content: "",
          is_cached: false,
        });
      setSystemPrompts((prev) => [...prev, newPrompt]);

      if (currentId) {
        handleSystemPromptChange(newPrompt.id);
      }
    } catch (error) {
      console.error("Error creating system prompt:", error);
      setError("Failed to create system prompt");
    }
  };

  const handleDownloadTranscript = async () => {
    if (!currentId) return;

    try {
      const text =
        await ConversationsService.getTranscriptApiConversationsConvIdTranscriptGet(
          currentId,
          currentMetadata?.persona_name || "Assistant",
          currentMetadata?.user_name || "User"
        );

      const blob = new Blob([text], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentMetadata?.name || "conversation"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading transcript:", error);
      setError("Failed to download transcript");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ConversationsService.deleteConversationApiConversationsConvIdDelete(
        id
      );
      onConversationsChange(conversations.filter((c) => c.id !== id));
      if (currentId === id) {
        const sortedMetadata = sortConversations(conversations);
        const currentIndex = sortedMetadata.findIndex((c) => c.id === id);
        const nextMetadata =
          sortedMetadata[currentIndex + 1] || sortedMetadata[currentIndex - 1];
        setCurrentId(nextMetadata?.id || null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setError("Failed to delete conversation");
    }
  };

  const handleCloneConversation = async () => {
    if (!currentId) return;
    try {
      const clonedConv =
        await ConversationsService.cloneConversationApiConversationsConvIdClonePost(
          currentId
        );
      // Copy message count from source conversation for optimistic UI update
      const sourceConv = conversations.find((c) => c.id === currentId);
      const updatedClonedConv = {
        ...clonedConv,
        message_count: sourceConv?.message_count ?? 0,
      };
      onConversationsChange([updatedClonedConv, ...conversations]);
      setCurrentId(updatedClonedConv.id);
    } catch (error) {
      console.error("Error cloning conversation:", error);
      setError("Failed to clone conversation");
    }
  };

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Fetch voices when audio is enabled
  useEffect(() => {
    if (audioEnabled) {
      fetchVoices();
    }
  }, [audioEnabled, fetchVoices]);

  // Add this consolidated effect:
  useEffect(() => {
    if (currentMetadata) {
      setAudioEnabled(currentMetadata.audio_enabled ?? false);
      setSelectedVoiceId(currentMetadata.voice_id ?? null);
    }
  }, [currentMetadata]);

  // Add new handler for conversation changes
  const handleConversationChange = useCallback(
    (newId: string) => {
      // SEQUENCING IS IMPORTANT HERE
      shouldAutoScroll.current = true;
      setMessages([]);
      setCurrentId(newId);
    },
    [currentId]
  );

  const handlePersonaNameChange = async (newName: string) => {
    if (!currentId || !currentMetadata) return;

    setLocalPersonaName(newName);

    // Clear existing timeout
    if (personaNameDebounceRef.current) {
      clearTimeout(personaNameDebounceRef.current);
    }

    // Set new timeout
    personaNameDebounceRef.current = setTimeout(async () => {
      try {
        const updated =
          await ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
            currentId,
            {
              ...currentMetadata,
              persona_name: newName || null,
            }
          );

        onConversationsChange(
          conversations.map((c) => (c.id === currentId ? updated : c))
        );
      } catch (error) {
        console.error("Error updating persona name:", error);
        setError("Failed to update persona name");
      }
    }, 500); // 500ms debounce
  };

  const handleUserNameChange = async (newName: string) => {
    if (!currentId || !currentMetadata) return;

    setLocalUserName(newName);

    // Clear existing timeout
    if (userNameDebounceRef.current) {
      clearTimeout(userNameDebounceRef.current);
    }

    // Set new timeout
    userNameDebounceRef.current = setTimeout(async () => {
      try {
        const updated =
          await ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
            currentId,
            {
              ...currentMetadata,
              user_name: newName || null,
            }
          );

        onConversationsChange(
          conversations.map((c) => (c.id === currentId ? updated : c))
        );
      } catch (error) {
        console.error("Error updating user name:", error);
        setError("Failed to update user name");
      }
    }, 500); // 500ms debounce
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (personaNameDebounceRef.current) {
        clearTimeout(personaNameDebounceRef.current);
      }
      if (userNameDebounceRef.current) {
        clearTimeout(userNameDebounceRef.current);
      }
    };
  }, []);

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
          onConversationChange={handleConversationChange}
          onDelete={handleDelete}
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
                <div
                  className="flex items-center gap-2 group cursor-pointer min-w-0"
                  onClick={() => {
                    if (currentId) {
                      setIsEditingTitle(true);
                      setEditedTitle(currentMetadata?.name || "");
                    }
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="truncate">
                      {currentId
                        ? currentMetadata?.name || "Untitled"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                        setEditedTitle(currentMetadata?.name || "");
                      }}
                    />
                  )}
                </div>
              )}
              <div className="flex-1" />
              {currentId && (
                <>
                  {showCloseButton && (
                    <div
                      {...attributes}
                      {...listeners}
                      className="h-6 w-6 cursor-grab active:cursor-grabbing hover:bg-accent rounded-sm flex items-center justify-center"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="flex items-center">
                    {messages.length > 0 && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCloneConversation}
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
                    )}
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
              <div className="flex items-center gap-2 scale-75 transform">
                <label
                  htmlFor="persona-name"
                  className="text-2xs font-medium text-muted-foreground/70 cursor-pointer select-none"
                >
                  Persona Name
                </label>
                <Input
                  id="persona-name"
                  value={localPersonaName}
                  onChange={(e) => handlePersonaNameChange(e.target.value)}
                  placeholder="Assistant"
                  className="h-5 text-2xs w-32"
                />
              </div>
              <div className="flex items-center gap-2 scale-75 transform">
                <label
                  htmlFor="user-name"
                  className="text-2xs font-medium text-muted-foreground/70 cursor-pointer select-none"
                >
                  User Name
                </label>
                <Input
                  id="user-name"
                  value={localUserName}
                  onChange={(e) => handleUserNameChange(e.target.value)}
                  placeholder="User"
                  className="h-5 text-2xs w-32"
                />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2 scale-75 transform">
                <Checkbox
                  id="audio-enabled"
                  checked={audioEnabled}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    // If enabling TTS and no voice is selected, select the first available voice
                    const newVoiceId =
                      isChecked && !selectedVoiceId && voices.length > 0
                        ? voices[0].voice_id
                        : selectedVoiceId;

                    setAudioEnabled(isChecked);
                    if (newVoiceId !== selectedVoiceId) {
                      setSelectedVoiceId(newVoiceId);
                    }

                    if (currentId && currentMetadata) {
                      const newMetadata = {
                        ...currentMetadata,
                        audio_enabled: isChecked,
                        voice_id: newVoiceId,
                      };
                      ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
                        currentId,
                        newMetadata
                      )
                        .then((updated) => {
                          onConversationsChange(
                            conversations.map((c) =>
                              c.id === currentId ? updated : c
                            )
                          );
                        })
                        .catch((error) => {
                          console.error(
                            "Error updating audio settings:",
                            error
                          );
                          setError("Failed to update audio settings");
                          // Revert the local state on error
                          setAudioEnabled(
                            currentConversation?.audio_enabled ?? false
                          );
                          setSelectedVoiceId(
                            currentConversation?.voice_id ?? null
                          );
                        });
                    }
                  }}
                />
                <label
                  htmlFor="audio-enabled"
                  className="text-2xs font-medium text-muted-foreground/70 cursor-pointer select-none"
                >
                  TTS
                </label>
              </div>
              <Select
                value={selectedVoiceId ?? voices[0]?.voice_id}
                onValueChange={(value: string) => {
                  setSelectedVoiceId(value);
                  if (currentId && currentMetadata) {
                    const newMetadata = {
                      ...currentMetadata,
                      voice_id: value,
                    };
                    ConversationsService.updateMetadataApiConversationsConvIdMetadataPut(
                      currentId,
                      newMetadata
                    )
                      .then((updated) => {
                        onConversationsChange(
                          conversations.map((c) =>
                            c.id === currentId ? updated : c
                          )
                        );
                      })
                      .catch((error) => {
                        console.error("Error updating audio settings:", error);
                        setError("Failed to update audio settings");
                        // Revert the local state on error
                        setSelectedVoiceId(
                          currentConversation?.voice_id ?? null
                        );
                      });
                  }
                }}
                disabled={!audioEnabled}
              >
                <SelectTrigger className="h-5 text-2xs flex-shrink-0 w-48">
                  <SelectValue placeholder="Select Voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices
                    .sort((a, b) => {
                      if (
                        categoryOrder[a.category] !== categoryOrder[b.category]
                      ) {
                        return (
                          categoryOrder[a.category] - categoryOrder[b.category]
                        );
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .reduce((acc, voice, index, array) => {
                      if (
                        index === 0 ||
                        voice.category !== array[index - 1].category
                      ) {
                        acc.push(
                          <SelectItem
                            key={`separator-${voice.category}`}
                            value={`separator-${voice.category}`}
                            disabled
                            className="text-2xs font-bold"
                          >
                            {voice.category.charAt(0).toUpperCase() +
                              voice.category.slice(1)}{" "}
                            Voices
                          </SelectItem>
                        );
                      }
                      acc.push(
                        <SelectItem
                          key={voice.voice_id}
                          value={voice.voice_id}
                          className="text-2xs"
                        >
                          {voice.name}
                        </SelectItem>
                      );
                      return acc;
                    }, [] as JSX.Element[])}
                </SelectContent>
              </Select>
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
                    conversationMetadata={{
                      audioEnabled: currentConversation?.audio_enabled || false,
                      voiceModel: currentConversation?.voice_id || null,
                    }}
                    conversationId={currentId || ""}
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
                  messagesEndRef.current?.parentElement?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                <ChevronsUp className="h-4 w-4" />
              </Button>
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
                <ChevronsDown className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-2xs">
                {error}
              </div>
            )}

            <MessageInput
              ref={messageInputRef}
              onSend={async (newMessage, files) => {
                try {
                  await handleSend(newMessage, files);
                  messageInputRef.current?.clear();
                } catch (error) {
                  // Don't clear the input if sending failed
                  console.error("Error in message send:", error);
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
