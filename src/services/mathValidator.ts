import katex from 'katex';

export interface MathValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: string;
}

/**
 * Universal MathValidator for EduTest Smart
 * Checks LaTeX syntax, mismatched brackets, unclosed delimiters, and verifies KaTeX renderability.
 */
export const MathValidator = {
  /**
   * Validates a text containing math formulas or pure LaTeX
   */
  validate(content: string): MathValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content || typeof content !== 'string') {
      return { isValid: true, errors, warnings, sanitized: '' };
    }

    let sanitized = content;

    // 1. Check for mismatched curly braces inside LaTeX
    let openBraceCount = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{' && (i === 0 || content[i - 1] !== '\\')) {
        openBraceCount++;
      } else if (content[i] === '}' && (i === 0 || content[i - 1] !== '\\')) {
        openBraceCount--;
        if (openBraceCount < 0) {
          errors.push('Thừa dấu ngoặc nhọn đóng "}"');
          break;
        }
      }
    }
    if (openBraceCount > 0) {
      errors.push(`Chưa đóng ${openBraceCount} dấu ngoặc nhọn "{"`);
    }

    // 2. Check for unclosed math delimiters
    // Count unescaped dollar signs
    const dollarMatches = content.match(/(?<!\\)\$/g);
    if (dollarMatches && dollarMatches.length % 2 !== 0) {
      errors.push('Thiếu dấu đóng công thức "$". Số lượng dấu "$" phải là số chẵn.');
    }

    // Count \[ and \]
    const openDisplay = (content.match(/\\\[/g) || []).length;
    const closeDisplay = (content.match(/\\\]/g) || []).length;
    if (openDisplay !== closeDisplay) {
      errors.push('Mất cân bằng cặp dấu công thức riêng dòng "\\[" và "\\]".');
    }

    // Count \( and \)
    const openInline = (content.match(/\\\(/g) || []).length;
    const closeInline = (content.match(/\\\)/g) || []).length;
    if (openInline !== closeInline) {
      errors.push('Mất cân bằng cặp dấu công thức trong dòng "\\(" và "\\)".');
    }

    // 3. Extract and test KaTeX formulas individually
    const mathTokens: { formula: string; isDisplay: boolean }[] = [];

    // Extract \[...\]
    const displayRegex = /\\\[([\s\S]*?)\\\]/g;
    let match: RegExpExecArray | null;
    while ((match = displayRegex.exec(content)) !== null) {
      mathTokens.push({ formula: match[1], isDisplay: true });
    }

    // Extract $$...$$
    const doubleDollarRegex = /\$\$([\s\S]*?)\$\$/g;
    while ((match = doubleDollarRegex.exec(content)) !== null) {
      mathTokens.push({ formula: match[1], isDisplay: true });
    }

    // Extract \(...\)
    const inlineParenRegex = /\\\(([\s\S]*?)\\\)/g;
    while ((match = inlineParenRegex.exec(content)) !== null) {
      mathTokens.push({ formula: match[1], isDisplay: false });
    }

    // Extract $...$
    const singleDollarRegex = /(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g;
    while ((match = singleDollarRegex.exec(content)) !== null) {
      mathTokens.push({ formula: match[1], isDisplay: false });
    }

    // Test each formula in KaTeX
    mathTokens.forEach(({ formula, isDisplay }) => {
      const cleanFormula = formula.trim();
      if (cleanFormula) {
        try {
          katex.renderToString(cleanFormula, {
            displayMode: isDisplay,
            throwOnError: true,
            strict: false,
          });
        } catch (err: any) {
          const msg = err?.message || String(err);
          warnings.push(`Cú pháp LaTeX cần lưu ý: "${cleanFormula.substring(0, 30)}..." (${msg})`);
        }
      }
    });

    // Check if user typed LaTeX command outside math delimiter (e.g. \frac{1}{2} without $)
    if (
      mathTokens.length === 0 &&
      /\\(frac|sqrt|infty|lim|int|vec|alpha|beta|pi|sin|cos|tan|log|ln|mathbb|le|ge)\b/.test(content)
    ) {
      warnings.push('Phát hiện lệnh LaTeX chưa được bao quanh bởi dấu "$...$".');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized,
    };
  },

  /**
   * Automatically normalizes formulas (e.g. converts raw LaTeX without $ into $...$)
   */
  autoWrapLatex(text: string): string {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();

    // Already has delimiters
    if (
      trimmed.startsWith('$') ||
      trimmed.startsWith('\\(') ||
      trimmed.startsWith('\\[')
    ) {
      return text;
    }

    // Check if the whole string looks like a formula (e.g. (-\infty;-1) or \frac{a}{b})
    if (
      /^(\\frac|\\sqrt|\\infty|-\\infty|\\vec|[0-9a-zA-Z\s\+\-\*\/\^\_\(\)\{\}\;\:\,\.\=\<\>\\\[\]]+)$/.test(trimmed) &&
      /(\\frac|\\sqrt|\\infty|\\le|\\ge|\\in|\\cup|\\cap|\^|\_)/.test(trimmed)
    ) {
      return `$${trimmed}$`;
    }

    return text;
  },

  validateLatex(content: string): MathValidationResult {
    return this.validate(content);
  },
};
