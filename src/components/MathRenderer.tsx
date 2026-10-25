import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // First process double dollar $$...$$ as block math
    // Then single dollar $...$ as inline math
    let text = content;
    
    // Replace block math $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return `<div class="my-2 py-1 overflow-x-auto text-center">${katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch {
        return `<span class="text-rose-500 font-mono text-xs">[Lỗi công thức: ${math}]</span>`;
      }
    });

    // Replace inline math $...$
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return `<span class="text-rose-500 font-mono text-xs">[Lỗi: ${math}]</span>`;
      }
    });

    // Replace newlines with <br/> if not within HTML tags
    const paragraphs = text.split('\n').join('<br/>');
    return paragraphs;
  }, [content]);

  return (
    <span
      className={`inline-block math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
