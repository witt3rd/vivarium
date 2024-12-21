import { Message } from "@/api/models/Message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
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
}

export function MessageComponent({
  message,
  onEdit,
  onDelete,
  isCached = false,
  onCacheChange,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<MessageContent[]>(
    message.content as MessageContent[]
  );

  const isSystemPrompt = message.role === "system";

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
  };

  const handleCancel = () => {
    setEditedContent(message.content as MessageContent[]);
    setIsEditing(false);
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

  return (
    <Card className={`mb-4 ${isSystemPrompt ? "border-blue-500" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between py-0.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-medium capitalize text-muted-foreground/70">
            {message.role}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 scale-50 transform">
            <Checkbox
              id={`cache-${message.id}`}
              checked={isCached}
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  handleCacheChange(checked);
                }
              }}
              className="h-3 w-3"
            />
            <label
              htmlFor={`cache-${message.id}`}
              className="text-[18px] font-medium text-muted-foreground/70 cursor-pointer select-none"
            >
              Cache
            </label>
          </div>
          <Button
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={handleEdit}
          >
            <div className="scale-50 transform">
              <Edit2 size={16} strokeWidth={1} />
            </div>
          </Button>
          <Button
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={handleCopy}
          >
            <div className="scale-50 transform">
              <Copy size={16} strokeWidth={1} />
            </div>
          </Button>
          <Button
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={handleDelete}
          >
            <div className="scale-50 transform">
              <Trash2 size={16} strokeWidth={1} />
            </div>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {isSystemPrompt ? (
              <>
                <Input
                  placeholder="System Prompt Name"
                  value={(editedContent[0] as MessageContent).text}
                  onChange={(e) =>
                    setEditedContent([
                      { type: "text", text: e.target.value },
                      editedContent[1],
                    ])
                  }
                />
                <Textarea
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
              <Textarea
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
            <h3 className="font-medium">
              {(message.content[0] as MessageContent).text}
            </h3>
            <div className="overflow-hidden">
              <MessageContentComponent
                content={[message.content[1] as MessageContent]}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <MessageContentComponent
                content={message.content as MessageContent[]}
              />
            </div>
            {message.role === "assistant" && message.usage && (
              <div className="text-[8px] text-muted-foreground/70 mt-2 flex gap-4">
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
  );
}
