import { useEffect, useState } from 'react';
import { buildPdfViewerUrl, revokePdfViewerUrl } from '../services/invoice-pdf.service';

interface InvoicePdfViewerProps {
  pdfBlob: Blob | null;
  correlationCode: string;
}

export function InvoicePdfViewer({ pdfBlob, correlationCode }: InvoicePdfViewerProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfBlob) {
      setUrl(null);
      return;
    }
    const generated = buildPdfViewerUrl(pdfBlob);
    setUrl(generated);
    return () => revokePdfViewerUrl(generated);
  }, [pdfBlob]);

  if (!url) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
        Vista previa del PDF no disponible
      </div>
    );
  }

  return (
    <iframe
      title={`Factura ${correlationCode}`}
      src={url}
      className="h-[600px] w-full rounded-lg border border-slate-200"
    />
  );
}
