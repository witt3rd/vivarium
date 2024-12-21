import { ScrollArea } from "@/components/ui/scroll-area";
import { useRemark } from "@/hooks/use-remark";
import { useEffect, useRef, useState } from "react";

interface MessageContent {
  type: string;
  text: string;
  [key: string]: unknown;
}

interface MessageContentProps {
  content: MessageContent[];
}

export function MessageContent({ content }: MessageContentProps) {
  const [reactContent, setMarkdownSource] = useRemark({
    onError: (err) => console.error("Error parsing markdown:", err),
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    // Combine all text content into a single markdown string
    const markdown = content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n\n");
    setMarkdownSource(markdown);
  }, [content, setMarkdownSource]);

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setShouldScroll(height > 400);
    }
  }, [reactContent]);

  return (
    <div className="relative">
      {shouldScroll ? (
        <ScrollArea className="h-[400px]">
          <div ref={contentRef} className="prose dark:prose-invert pr-4">
            {reactContent}
          </div>
        </ScrollArea>
      ) : (
        <div ref={contentRef} className="prose dark:prose-invert">
          {reactContent}
        </div>
      )}
    </div>
  );
}
