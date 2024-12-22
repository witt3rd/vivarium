import { ScrollArea } from "@/components/ui/scroll-area";
import { useRemark } from "@/hooks/use-remark";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  // Memoize the markdown transformation
  const markdownContent = useMemo(() => {
    return content
      .filter((c) => c.type === "text")
      .map((c) => {
        return c.text.replace(
          /<([^>]+)>([\s\S]*?)<\/\1>/g,
          (_, tag, content) => `\`\`\`${tag}\n${content}\n\`\`\``
        );
      })
      .join("\n\n");
  }, [content]);

  useEffect(() => {
    setMarkdownSource(markdownContent);
  }, [markdownContent, setMarkdownSource]);

  // Debounced scroll height check
  const debouncedCheck = useMemo(
    () =>
      debounce(() => {
        if (contentRef.current) {
          const height = contentRef.current.scrollHeight;
          setShouldScroll(height > 400);
        }
      }, 100),
    []
  );

  const checkScrollHeight = useCallback(debouncedCheck, [debouncedCheck]);

  useEffect(() => {
    checkScrollHeight();
    return () => {
      checkScrollHeight.cancel();
    };
  }, [reactContent, checkScrollHeight]);

  // Memoize the rendered content
  const renderedContent = useMemo(() => {
    return (
      <div ref={contentRef} className="prose prose-xs dark:prose-invert">
        {reactContent}
      </div>
    );
  }, [reactContent]);

  return (
    <div className="relative">
      {shouldScroll ? (
        <ScrollArea className="h-[400px]">
          <div className="pr-4">{renderedContent}</div>
        </ScrollArea>
      ) : (
        renderedContent
      )}
    </div>
  );
}
