import React, { useMemo } from 'react';
import katex from 'katex';

export interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Enhanced Universal MathRenderer for EduTest Smart.
 * Seamlessly handles:
 * - $$...$$ and \[...\] for block display formulas
 * - $...$ and \(...\) for inline formulas
 * - Auto-detects standalone mathematical expressions (e.g. `(-\infty;-1)`, `\frac{a}{b}`, `-\infty`)
 * - Preserves minus signs, fractions, intervals, limits, vectors, matrices, and Vietnamese text.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content && content !== '0') return '';

    let text = String(content);

    // KaTeX safe render function
    const renderKaTeXSafe = (formula: string, isBlock: boolean): string => {
      let cleanFormula = formula.trim();
      if (!cleanFormula) return '';

      // Standardize comma decimal for Vietnamese Math notation if needed
      // (e.g., in coordinates or intervals (0;2) or (-1;2), keep semicolon intact)
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
            '\\vv': '\\vec',
            '\\dx': '\\,\\mathrm{d}x',
            '\\dt': '\\,\\mathrm{d}t',
            '\\du': '\\,\\mathrm{d}u',
            '\\dv': '\\,\\mathrm{d}v',
          },
        });
      } catch {
        return `<span class="katex-fallback font-mono px-1 py-0.5 bg-slate-100 rounded text-slate-800">${escapeHtml(cleanFormula)}</span>`;
      }
    };

    // Placeholder management
    const placeholders: string[] = [];
    const savePlaceholder = (html: string): string => {
      const token = `___EDUTEST_MATH_TOKEN_${placeholders.length}___`;
      placeholders.push(html);
      return token;
    };

    // 1. Process \[...\] (Display block math)
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      const html = `<div class="katex-display-wrapper my-3 py-1 overflow-x-auto text-center">${renderKaTeXSafe(math, true)}</div>`;
      return savePlaceholder(html);
    });

    // 2. Process $$...$$ (Display block math)
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      const html = `<div class="katex-display-wrapper my-3 py-1 overflow-x-auto text-center">${renderKaTeXSafe(math, true)}</div>`;
      return savePlaceholder(html);
    });

    // 3. Process \(...\) (Inline math)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      const html = `<span class="inline-math inline-block align-middle px-0.5">${renderKaTeXSafe(math, false)}</span>`;
      return savePlaceholder(html);
    });

    // 4. Process $...$ (Inline math)
    text = text.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_, math) => {
      const html = `<span class="inline-math inline-block align-middle px-0.5">${renderKaTeXSafe(math, false)}</span>`;
      return savePlaceholder(html);
    });

    // 5. Smart heuristic: If text contains no math tokens yet, but contains raw LaTeX symbols
    // like \frac, \sqrt, \infty, -\infty, \lim, \int, \vec, \alpha, etc.
    if (
      placeholders.length === 0 &&
      /(\\frac|\\sqrt|\\infty|\\lim|\\int|\\vec|\\mathbb|\\cap|\\cup|\\in|\\le|\\ge)/.test(text)
    ) {
      // Entire text or segments with backslash
      const html = `<span class="inline-math inline-block align-middle px-0.5">${renderKaTeXSafe(text, false)}</span>`;
      return html;
    }

    // Escape non-math text portions
    text = escapeHtml(text).split('\n').join('<br/>');

    // Restore math placeholders
    placeholders.forEach((tokenHtml, idx) => {
      const token = `___EDUTEST_MATH_TOKEN_${idx}___`;
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
