import { useRemark } from "@/hooks/use-remark";
import { useEffect } from "react";

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

  useEffect(() => {
    // Combine all text content into a single markdown string
    const markdown = content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n\n");
    setMarkdownSource(markdown);
  }, [content, setMarkdownSource]);

  return <div className="prose dark:prose-invert">{reactContent}</div>;
}
