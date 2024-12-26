import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SmallTextarea } from "@/components/ui/small-inputs";
import { Image, X } from "lucide-react";
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
  onSend: (message: string, files?: File[]) => void;
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedImages, setAttachedImages] = useState<File[]>([]);

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

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const message = e.currentTarget.value.trim();
          if (message && !loading) {
            onSend(
              message,
              attachedImages.length > 0 ? attachedImages : undefined
            );
          }
        }
      },
      [onSend, loading, attachedImages]
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
          <SmallTextarea
            ref={textareaRef}
            className="resize-none"
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            rows={3}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={loading}
            autoFocus
          />
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>
    );
  }
);
