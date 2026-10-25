import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Universal MathRenderer for EduTest Smart.
 * Supports:
 * - $$...$$ and \[...\] for display block math
 * - $...$ and \(...\) for inline math
 * - Standard KaTeX options with error recovery so raw LaTeX or unescaped symbols never crash the app.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let text = content;

    // Helper to safely render KaTeX string
    const renderKaTeXSafe = (formula: string, isBlock: boolean): string => {
      const cleanFormula = formula.trim();
      if (!cleanFormula) return '';
      try {
        return katex.renderToString(cleanFormula, {
          displayMode: isBlock,
          throwOnError: false,
          output: 'htmlAndMathml',
          strict: false,
          trust: true,
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\Q': '\\mathbb{Q}',
            '\\C': '\\mathbb{C}',
            '\\dx': '\\,\\mathrm{d}x',
            '\\dt': '\\,\\mathrm{d}t',
            '\\du': '\\,\\mathrm{d}u',
            '\\dv': '\\,\\mathrm{d}v',
          },
        });
      } catch {
        // Fallback: render in monospace without breaking layout
        return `<span class="katex-fallback font-mono px-1 py-0.5 bg-slate-100 rounded text-slate-800">${escapeHtml(cleanFormula)}</span>`;
      }
    };

    // Placeholder storage to prevent nested regex collisions
    const placeholders: string[] = [];
    const savePlaceholder = (html: string): string => {
      const token = `__MATH_TOKEN_${placeholders.length}__`;
      placeholders.push(html);
      return token;
    };

    // 1. Process \[...\] (Display block math)
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      const html = `<div class="my-3 py-1 overflow-x-auto text-center">${renderKaTeXSafe(math, true)}</div>`;
      return savePlaceholder(html);
    });

    // 2. Process $$...$$ (Display block math)
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      const html = `<div class="my-3 py-1 overflow-x-auto text-center">${renderKaTeXSafe(math, true)}</div>`;
      return savePlaceholder(html);
    });

    // 3. Process \(...\) (Inline math)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      const html = `<span class="inline-math px-0.5">${renderKaTeXSafe(math, false)}</span>`;
      return savePlaceholder(html);
    });

    // 4. Process $...$ (Inline math)
    // Note: avoid matching currency or escaped \$
    text = text.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_, math) => {
      const html = `<span class="inline-math px-0.5">${renderKaTeXSafe(math, false)}</span>`;
      return savePlaceholder(html);
    });

    // Escape pure HTML in the non-math portions to prevent XSS
    // while keeping paragraph line breaks
    text = escapeHtml(text).split('\n').join('<br/>');

    // Restore placeholders
    placeholders.forEach((tokenHtml, idx) => {
      const token = `__MATH_TOKEN_${idx}__`;
      text = text.split(token).join(tokenHtml);
    });

    return text;
  }, [content]);

  if (inline) {
    return (
      <span
        className={`math-content select-text ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      className={`math-content select-text leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
