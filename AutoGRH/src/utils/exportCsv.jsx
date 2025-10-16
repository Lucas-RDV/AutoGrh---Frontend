function toCsvField(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows, headers) {
  const head = headers.map(h => toCsvField(h.label)).join(';');
  const lines = rows.map(row =>
    headers.map(h => toCsvField(h.value(row))).join(';')
  );
  return [head, ...lines].join('\n');
}

export function downloadCsv(filename, csvString) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
