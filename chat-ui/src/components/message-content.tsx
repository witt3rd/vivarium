import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRemark } from "@/hooks/use-remark";
import { cn } from "@/lib/utils";
import debounce from "lodash/debounce";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MessageContent {
  type: string;
  text?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
  [key: string]: unknown;
}

interface MessageContentProps {
  content: MessageContent[];
}

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

function CodeBlock({ children, className, language }: CodeBlockProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      typeof children === "string" ? children : ""
    );
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
        p: ({ children, ...props }) => <div {...props}>{children}</div>,
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
        return (
          c.text?.replace(
            /<([^>]+)>([\s\S]*?)<\/\1>/g,
            (_, tag, content) => `\`\`\`${tag}\n${content}\n\`\`\``
          ) || ""
        );
      })
      .join("\n\n");
  }, [content]);

  // Extract images from content
  const images = useMemo(() => {
    return content.filter((c) => c.type === "image" && c.source);
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
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {images.map((image, index) => (
              <img
                key={index}
                src={`data:${image.source?.media_type};base64,${image.source?.data}`}
                alt={`Image ${index + 1}`}
                className="max-h-64 rounded"
              />
            ))}
          </div>
        )}
        {reactContent}
      </div>
    );
  }, [reactContent, images]);

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
