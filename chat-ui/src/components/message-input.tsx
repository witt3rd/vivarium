import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SmallTextarea } from "@/components/ui/small-inputs";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface MessageInputHandle {
  clear: () => void;
  focus: () => void;
}

interface MessageInputProps {
  onSend: (message: string) => void;
  isPreCached: boolean;
  onPreCacheChange: (cached: boolean) => void;
  loading?: boolean;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  function MessageInput(
    { onSend, isPreCached, onPreCacheChange, loading = false },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      },
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const message = e.currentTarget.value.trim();
          if (message && !loading) {
            onSend(message);
          }
        }
      },
      [onSend, loading]
    );

    return (
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between py-0.5 px-1">
          <span className="text-3xs font-medium capitalize text-muted-foreground/70">
            User
          </span>
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
        </CardHeader>
        <CardContent className="p-2">
          <SmallTextarea
            ref={textareaRef}
            className="resize-none"
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            rows={3}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />
        </CardContent>
      </Card>
    );
  }
);
