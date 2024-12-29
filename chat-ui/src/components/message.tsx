import { Message } from "@/api/models/Message";
import { MessageImage } from "@/api/models/MessageImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmallInput, SmallTextarea } from "@/components/ui/small-inputs";
import { cn } from "@/lib/utils";
import { Copy, Edit2, Eye, EyeOff, Pause, Play, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MessageContent as MessageContentComponent } from "./message-content";

interface MessageContent {
  type: string;
  text: string;
  [key: string]: unknown;
}

interface MessageProps {
  message: Message;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  isCached?: boolean;
  onCacheChange?: (messageId: string, cached: boolean) => void;
  conversationMetadata: {
    audioEnabled: boolean;
    voiceModel: string | null;
  };
  conversationId: string;
  startInEditMode?: boolean;
  onEditComplete?: () => void;
}

export function MessageComponent({
  message,
  onEdit,
  onDelete,
  isCached = false,
  onCacheChange,
  conversationMetadata,
  conversationId,
  startInEditMode = false,
  onEditComplete,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editedContent, setEditedContent] = useState<MessageContent[]>(
    message.content as MessageContent[]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isContentVisible, setIsContentVisible] = useState(!isCached);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const getImageUrl = (image: MessageImage) => {
    return `/api/conversations/${conversationId}/images/${image.id}`;
  };

  const isSystemPrompt = message.role === "system";

  const shouldDisplayPlayButton =
    message.role === "assistant" &&
    conversationMetadata?.audioEnabled &&
    conversationMetadata?.voiceModel;

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async (audioData: ArrayBuffer) => {
    try {
      // Create new audio context
      audioContextRef.current = new AudioContext();

      // Decode the audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        audioData
      );

      // Create and configure source node
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.connect(audioContextRef.current.destination);

      // Handle playback completion
      sourceNodeRef.current.onended = () => {
        stopAudio();
      };

      // Start playback
      sourceNodeRef.current.start();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      stopAudio();
    }
  };

  const handlePlayStop = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      const messageText = message.content
        .map((c) => (c as MessageContent).text)
        .join("\n");

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${conversationMetadata.voiceModel}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            model_id: "eleven_multilingual_v2",
            text: messageText,
            voice_settings: {
              similarity_boost: 0.5,
              stability: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      await playAudio(arrayBuffer);
    } catch (error) {
      console.error("Error fetching or playing audio:", error);
      stopAudio();
    }
  };

  // Cleanup audio context when component unmounts
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleEdit = () => {
    if (!isEditing) {
      setEditedContent(message.content as MessageContent[]);
    }
    setIsEditing(!isEditing);
  };

  const handleCopy = async () => {
    const text = message.content
      .map((c) => (c as MessageContent).text)
      .join("\n");
    await navigator.clipboard.writeText(text);
  };

  const handleSave = () => {
    onEdit?.({
      ...message,
      content: editedContent,
    });
    setIsEditing(false);
    onEditComplete?.();
  };

  const handleCancel = () => {
    setEditedContent(message.content as MessageContent[]);
    setIsEditing(false);
    onEditComplete?.();
  };

  const handleDelete = () => {
    if (message.id && onDelete) {
      onDelete(message.id);
    }
  };

  const handleCacheChange = (checked: boolean) => {
    if (message.id && onCacheChange) {
      onCacheChange(message.id, checked);
    }
  };

  // Start in edit mode if startInEditMode is true
  useEffect(() => {
    if (startInEditMode) {
      setIsEditing(true);
      setEditedContent(message.content as MessageContent[]);
    }
  }, [startInEditMode, message.content]);

  return (
    <>
      <Card className={`mb-4 ${isSystemPrompt ? "border-blue-500" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between py-0.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-3xs font-medium capitalize text-muted-foreground/70">
              {message.role}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-transparent group"
              onClick={() => setIsContentVisible(!isContentVisible)}
              title={isContentVisible ? "Hide content" : "Show content"}
            >
              <div className="scale-50 transform">
                {isContentVisible ? (
                  <EyeOff
                    size={16}
                    strokeWidth={1}
                    className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                  />
                ) : (
                  <Eye
                    size={16}
                    strokeWidth={1}
                    className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                  />
                )}
              </div>
            </Button>
            {shouldDisplayPlayButton && (
              <Button
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-transparent group"
                onClick={handlePlayStop}
              >
                <div className="scale-50 transform">
                  {isPlaying ? (
                    <Pause
                      size={16}
                      strokeWidth={1}
                      className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                    />
                  ) : (
                    <Play
                      size={16}
                      strokeWidth={1}
                      className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                    />
                  )}
                </div>
              </Button>
            )}
            <div className="flex items-center gap-2 scale-50 transform">
              <div
                className={cn(
                  "flex items-center gap-2 group hover:text-foreground hover:opacity-100 transition-all",
                  (message.images?.length ?? 0) > 0 && "cursor-not-allowed"
                )}
              >
                <Checkbox
                  id={`cache-${message.id}`}
                  checked={isCached}
                  onCheckedChange={(checked) => {
                    if (
                      typeof checked === "boolean" &&
                      !(message.images?.length ?? 0)
                    ) {
                      handleCacheChange(checked);
                    }
                  }}
                  className="h-3 w-3 text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                  disabled={(message.images?.length ?? 0) > 0}
                  title={
                    (message.images?.length ?? 0) > 0
                      ? "Messages with images cannot be cached"
                      : "Cache this message"
                  }
                />
                <label
                  htmlFor={`cache-${message.id}`}
                  className="text-2xs font-medium text-muted-foreground/70 cursor-pointer select-none group-hover:text-foreground group-hover:opacity-100 transition-all"
                >
                  Cache
                </label>
              </div>
            </div>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-transparent group"
              onClick={handleEdit}
              title="Edit message"
            >
              <div className="scale-50 transform">
                <Edit2
                  size={16}
                  strokeWidth={1}
                  className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                />
              </div>
            </Button>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-transparent group"
              onClick={handleCopy}
              title="Copy message"
            >
              <div className="scale-50 transform">
                <Copy
                  size={16}
                  strokeWidth={1}
                  className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                />
              </div>
            </Button>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-transparent group"
              onClick={handleDelete}
              title="Delete message"
            >
              <div className="scale-50 transform">
                <Trash2
                  size={16}
                  strokeWidth={1}
                  className="text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100 transition-all"
                />
              </div>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-1">
          {isEditing ? (
            <div className="space-y-4">
              {isSystemPrompt ? (
                <>
                  <SmallInput
                    placeholder="System Prompt Name"
                    value={(editedContent[0] as MessageContent).text}
                    onChange={(e) =>
                      setEditedContent([
                        { type: "text", text: e.target.value },
                        editedContent[1],
                      ])
                    }
                  />
                  <SmallTextarea
                    placeholder="System Prompt Content"
                    value={(editedContent[1] as MessageContent).text}
                    onChange={(e) =>
                      setEditedContent([
                        editedContent[0],
                        { type: "text", text: e.target.value },
                      ])
                    }
                    className="min-h-[100px]"
                  />
                </>
              ) : (
                <SmallTextarea
                  value={editedContent
                    .map((c) => (c as MessageContent).text)
                    .join("\n")}
                  onChange={(e) =>
                    setEditedContent([{ type: "text", text: e.target.value }])
                  }
                  className="min-h-[100px]"
                />
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          ) : isSystemPrompt ? (
            <div className="space-y-2">
              <h3 className="font-medium text-2xs">
                {(message.content[0] as MessageContent).text}
              </h3>
              <div className="overflow-hidden">
                <MessageContentComponent
                  content={[message.content[1] as MessageContent]}
                  isCached={isCached}
                  isVisible={isContentVisible}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
                <MessageContentComponent
                  content={message.content as MessageContent[]}
                  isCached={isCached}
                  isVisible={isContentVisible}
                />
              </div>
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={getImageUrl(image as MessageImage)}
                        alt={image.filename}
                        className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setSelectedImageId(image.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {message.role === "assistant" && message.usage && (
                <div className="font-mono text-3xs text-muted-foreground/70 mt-2 flex gap-4">
                  <span>Input: {message.usage.input_tokens}</span>
                  <span>
                    Cache Created:{" "}
                    {message.usage.cache_creation_input_tokens ?? 0}
                  </span>
                  <span>
                    Cache Read: {message.usage.cache_read_input_tokens ?? 0}
                  </span>
                  <span>Output: {message.usage.output_tokens}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedImageId !== null}
        onOpenChange={() => setSelectedImageId(null)}
      >
        <DialogContent className="max-w-screen-lg w-fit">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Image from {message.role}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedImageId}
            </DialogDescription>
          </DialogHeader>
          {selectedImageId && message.images && (
            <img
              src={getImageUrl(
                message.images.find(
                  (img) => img.id === selectedImageId
                ) as MessageImage
              )}
              alt="Full size image"
              className="max-h-[80vh] w-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
