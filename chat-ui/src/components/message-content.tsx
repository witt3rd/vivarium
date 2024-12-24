import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRemark } from "@/hooks/use-remark";
import { cn } from "@/lib/utils";
import debounce from "lodash/debounce";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MessageContent {
  type: string;
  text: string;
  [key: string]: unknown;
}

interface MessageContentProps {
  content: MessageContent[];
}

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

function CodeBlock({ children, className, language }: CodeBlockProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
  };

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
      <pre className={cn("mt-2", className)}>
        <code className={language}>{children}</code>
      </pre>
    </div>
  );
}

export function MessageContent({ content }: MessageContentProps) {
  const [reactContent, setMarkdownSource] = useRemark({
    rehypeReactOptions: {
      components: {
        code: CodeBlock,
      },
    },
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
      <div
        ref={contentRef}
        className="prose prose-xs dark:prose-invert w-full max-w-none"
      >
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
