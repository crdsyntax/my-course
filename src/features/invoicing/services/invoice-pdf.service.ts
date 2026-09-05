/** Client-side utilities for handling invoice PDF blobs/streams. */

function resolveFilename(suggested: string | null, fallback: string): string {
  if (suggested && suggested.endsWith('.pdf')) return suggested;
  return `${fallback}.pdf`;
}

export function downloadPdfBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function fetchAndDownloadPdf(
  source: Blob | Promise<Blob>,
  fallbackName: string,
  suggestedName: string | null = null,
): Promise<void> {
  const blob = await source;
  const fileName = resolveFilename(suggestedName, fallbackName);
  downloadPdfBlob(blob, fileName);
}

export function buildPdfViewerUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokePdfViewerUrl(url: string): void {
  URL.revokeObjectURL(url);
}
