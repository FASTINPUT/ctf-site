"use client";
/* eslint-disable @next/next/no-img-element -- Markdown attachments have unknown dimensions and external storage origins; use native lazy loading. */
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useState, Children, isValidElement, type ReactNode } from "react";
import { Button } from "./ui";
function plain(node: ReactNode): string {
  return Children.toArray(node)
    .map((x) =>
      isValidElement<{ children?: ReactNode }>(x)
        ? plain(x.props.children)
        : String(x),
    )
    .join("");
}
function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const child = Children.toArray(children)[0];
  const cls = isValidElement<{ className?: string }>(child)
    ? child.props.className || ""
    : "";
  const lang = cls.match(/language-([\w+#-]+)/)?.[1] || "text";
  return (
    <div className="codeblock">
      <div className="codebar">
        <span>{lang}</span>
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(plain(children));
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "복사됨" : "코드 복사"}
        </Button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
export default function Markdown({ content }: { content: string }) {
  let heading = 0;
  function render(source: string, key: number) {
    return (
      <ReactMarkdown
        key={key}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
        skipHtml
        urlTransform={(url) =>
          /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url)
            ? defaultUrlTransform(url)
            : ""
        }
        components={{
          h2: ({ children }) => <h2 id={`section-${heading++}`}>{children}</h2>,
          h3: ({ children }) => <h3 id={`section-${heading++}`}>{children}</h3>,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          table: ({ children }) => (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("#") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" && src ? (
              <img
                src={src}
                alt={alt || "첨부 이미지"}
                loading="lazy"
                decoding="async"
              />
            ) : null,
        }}
      >
        {source}
      </ReactMarkdown>
    );
  }
  // Explicit fenced spoiler blocks are UI-only; their source remains public.
  const chunks = spoilerChunks(content);
  return (
    <div className="prose">
      {chunks.map((chunk, i) =>
        chunk.title !== undefined ? (
          <details className="spoiler" key={i}>
            <summary>{chunk.title || "FLAG / 정답 보기"}</summary>
            {render(chunk.content, i)}
          </details>
        ) : (
          render(chunk.content, i)
        ),
      )}
    </div>
  );
}

// A spoiler marker inside a fenced code block must remain literal Markdown.
function spoilerChunks(source: string): { content: string; title?: string }[] {
  const lines = source.split("\n"),
    chunks: { content: string; title?: string }[] = [];
  let normal: string[] = [],
    fence: { char: string; length: number } | null = null;
  const scan = (line: string, current: typeof fence): typeof fence => {
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (!opening) return current;
    if (!current) return { char: opening[1][0], length: opening[1].length };
    if (
      opening[1][0] === current.char &&
      opening[1].length >= current.length &&
      line.slice(opening[0].length).trim() === ""
    )
      return null;
    return current;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i],
      start = !fence ? line.match(/^:::spoiler(.*)$/) : null;
    if (start) {
      let end = i + 1,
        innerFence: typeof fence = null;
      for (; end < lines.length; end++) {
        if (!innerFence && /^:::\s*$/.test(lines[end])) break;
        innerFence = scan(lines[end], innerFence);
      }
      if (end < lines.length) {
        if (normal.length) chunks.push({ content: normal.join("\n") });
        normal = [];
        chunks.push({
          title: start[1].trim(),
          content: lines.slice(i + 1, end).join("\n"),
        });
        i = end;
        continue;
      }
    }
    normal.push(line);
    fence = scan(line, fence);
  }
  if (normal.length) chunks.push({ content: normal.join("\n") });
  return chunks;
}
