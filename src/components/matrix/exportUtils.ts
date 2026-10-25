/**
 * Document Export Utility for EduTest Smart
 * Generates Word (.doc) and printable HTML documents for Matrices, Specifications, Exams, and Rubrics.
 */

export function downloadWordDocument(filename: string, title: string, htmlContent: string) {
  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
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
  </style>
</head>
<body>
${htmlContent}
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

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
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
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}
