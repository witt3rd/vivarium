import { ConversationMetadata } from "@/api/models/ConversationMetadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SmallTextarea } from "@/components/ui/small-inputs";
import { Image, Loader2, Send, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface MessageInputHandle {
  clear: () => void;
  focus: () => void;
}

interface MessageInputProps {
  onSend: (
    message: string,
    targetPersonaId: string | null,
    abortController: AbortController,
    files?: File[]
  ) => Promise<void>;
  isPreCached: boolean;
  onPreCacheChange: (cached: boolean) => void;
  loading?: boolean;
  conversations: ConversationMetadata[];
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  function MessageInput(
    { onSend, isPreCached, onPreCacheChange, loading = false, conversations },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedImages, setAttachedImages] = useState<File[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [selectedPersona, setSelectedPersona] =
      useState<ConversationMetadata | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Keep focus on the textarea
    useEffect(() => {
      textareaRef.current?.focus();
    }, [loading]); // Re-focus after loading changes

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (textareaRef.current) {
          textareaRef.current.value = "";
          textareaRef.current.focus();
        }
        setAttachedImages([]);
      },
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const handleSend = useCallback(async () => {
      const message = inputValue.trim();
      if (!loading && (message || selectedPersona)) {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        try {
          await onSend(
            message,
            selectedPersona?.id || null,
            abortControllerRef.current,
            attachedImages.length > 0 ? attachedImages : undefined
          );
          setInputValue("");
        } finally {
          abortControllerRef.current = null;
        }
      }
    }, [onSend, loading, attachedImages, selectedPersona, inputValue]);

    const handleCancel = useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [handleSend]
    );

    const validateAndAddImage = useCallback(
      (file: File) => {
        const isValidType = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

        if (isValidType && isValidSize && attachedImages.length < 20) {
          setAttachedImages((prev) => [...prev, file]);
          return true;
        }
        return false;
      },
      [attachedImages.length]
    );

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(validateAndAddImage);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handlePaste = useCallback(
      async (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              validateAndAddImage(file);
            }
          }
        }
      },
      [validateAndAddImage]
    );

    const removeImage = (index: number) => {
      setAttachedImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between py-0.5 px-1">
          <span className="text-3xs font-medium capitalize text-muted-foreground/70">
            User
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 scale-50 transform origin-right">
              <Checkbox
                id="pre-cache"
                checked={isPreCached}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") {
                    onPreCacheChange(checked);
                  }
                }}
                className="h-3 w-3"
              />
              <label
                htmlFor="pre-cache"
                className="text-2xs font-medium text-muted-foreground/70 cursor-pointer select-none"
              >
                Cache
              </label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || attachedImages.length >= 20}
              title="Upload images"
            >
              <div className="scale-50 transform">
                <Image size={16} strokeWidth={1} />
              </div>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2 space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleImageSelect}
          />
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col">
              <SmallTextarea
                ref={textareaRef}
                className="resize-none flex-1 min-h-[120px]"
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                rows={3}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onChange={(e) => setInputValue(e.target.value)}
                value={inputValue}
                disabled={loading}
                autoFocus
              />
              {attachedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-background/80 hover:bg-background rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-64 flex flex-col gap-2">
              <Command className="rounded-lg border shadow-md">
                <CommandInput
                  placeholder="Search personas..."
                  className="h-7 text-2xs"
                />
                <CommandList>
                  <ScrollArea className="h-[80px]">
                    <CommandEmpty>No personas found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setSelectedPersona(null)}
                        className="text-2xs cursor-pointer"
                        data-state={selectedPersona === null ? "selected" : ""}
                      >
                        None (Send as User)
                      </CommandItem>
                      {conversations
                        .filter((conv) => conv.persona_name)
                        .sort((a, b) =>
                          (a.persona_name || "").localeCompare(
                            b.persona_name || ""
                          )
                        )
                        .map((conv) => (
                          <CommandItem
                            key={conv.id}
                            onSelect={() => setSelectedPersona(conv)}
                            className="text-2xs cursor-pointer"
                            data-state={
                              selectedPersona?.id === conv.id ? "selected" : ""
                            }
                          >
                            {conv.persona_name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
              </Command>
              <Button
                size="sm"
                variant={loading ? "destructive" : "default"}
                className="w-full h-7 text-2xs"
                onClick={loading ? handleCancel : handleSend}
                disabled={!loading && !selectedPersona && !inputValue.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Send{" "}
                    {selectedPersona
                      ? `to ${selectedPersona.persona_name}`
                      : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
