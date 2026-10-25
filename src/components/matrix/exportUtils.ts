import katex from 'katex';

/**
 * Converts raw LaTeX expressions ($...$, $$...$$, \(...\), \[...\])
 * into clean KaTeX HTML + MathML strings for Word documents and printing.
 */
export function renderLatexToHtmlString(text: string): string {
  if (!text) return '';

  // 1. Replace display-mode formulas ($$...$$ or \[...\])
  let result = text.replace(/(\$\$|\\\[)([\s\S]*?)(\$\$|\\\])/g, (_match, _open, formula) => {
    try {
      return `<div class="math-display" style="text-align: center; margin: 6pt 0;">${katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        output: 'htmlAndMathml',
      })}</div>`;
    } catch {
      return formula;
    }
  });

  // 2. Replace inline-mode formulas ($...$ or \(...\))
  result = result.replace(/(\$|\\\()([^\$]+?)(\$|\\\))/g, (_match, _open, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return formula;
    }
  });

  return result;
}

export function downloadWordDocument(filename: string, title: string, htmlContent: string) {
  const processedContent = renderLatexToHtmlString(htmlContent);
  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    body {
      font-family: 'Times New Roman', 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      margin: 2cm 2cm 2cm 2cm;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }
    th, td {
      border: 1px solid #000000;
      padding: 6pt;
      vertical-align: top;
      font-size: 11pt;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .header-table td {
      border: none !important;
      padding: 2pt 4pt;
    }
    .question-title {
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    .options-grid {
      margin-left: 20pt;
      margin-bottom: 8pt;
    }
    .katex { font-size: 1.05em; }
  </style>
</head>
<body>
${processedContent}
</body>
</html>`;

  const blob = new Blob(['\ufeff' + header], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

export function printDocument(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const processedContent = renderLatexToHtmlString(htmlContent);

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Times New Roman', Arial, sans-serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #111827;
      margin: 0;
      padding: 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
    }
    th, td {
      border: 1px solid #374151;
      padding: 6px 8px;
      font-size: 11pt;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .header-table td { border: none !important; }
    .katex { font-size: 1.05em; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${processedContent}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}
