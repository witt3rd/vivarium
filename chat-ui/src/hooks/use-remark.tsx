import { type ReactElement, useCallback, useState } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import rehypeReact, { type Components } from "rehype-react";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export type UseRemarkOptions = {
  onError?: (err: Error) => void;
  rehypePlugins?: any[];
  rehypeReactOptions?: {
    components?: Partial<Components>;
  };
  remarkParseOptions?: any;
  remarkPlugins?: any[];
  remarkToRehypeOptions?: any;
};

export const useRemark = ({
  onError = () => {},
  rehypePlugins = [],
  rehypeReactOptions,
  remarkParseOptions,
  remarkPlugins = [],
  remarkToRehypeOptions,
}: UseRemarkOptions = {}): [null | ReactElement, (source: string) => void] => {
  const [reactContent, setReactContent] = useState<null | ReactElement>(null);

  const setMarkdownSource = useCallback((source: string) => {
    unified()
      .use(remarkParse, remarkParseOptions)
      .use(remarkPlugins)
      .use(remarkRehype, remarkToRehypeOptions)
      .use(rehypePlugins)
      .use(rehypeReact, {
        ...rehypeReactOptions,
        Fragment: jsxRuntime.Fragment,
        jsx: jsxRuntime.jsx,
        jsxs: jsxRuntime.jsxs,
      })
      .process(source)
      .then((vfile) => setReactContent(vfile.result as ReactElement))
      .catch(onError);
  }, []);

  return [reactContent, setMarkdownSource];
};
