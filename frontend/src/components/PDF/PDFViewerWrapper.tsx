'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import PDFViewer from '@/components/PDF/PDFViewer';

interface PDFViewerWrapperProps {
  file?: File;
  url?: string;
  onPdfJsReady?: () => void;
  onPageTextExtracted?: (text: string, pageNumber: number) => void;
  
}

const PDFViewerWrapper: React.FC<PDFViewerWrapperProps> = ({ file, url, onPdfJsReady, onPageTextExtracted }) => {
  const PDFJS_VERSION = '3.11.174';
  const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
  const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    const checkPdfJs = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
        setIsScriptLoaded(true);
        onPdfJsReady?.();
      }
    };

    checkPdfJs();
    const interval = setInterval(checkPdfJs, 100);
    const timeout = setTimeout(() => clearInterval(interval), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [WORKER_URL, onPdfJsReady]);

  return (
    <>
      <Script
        src={PDFJS_URL}
        strategy="afterInteractive"
        onLoad={() => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
            setIsScriptLoaded(true);
            onPdfJsReady?.();
          }
        }}
      />
      {isScriptLoaded && <PDFViewer file={file} url={url} onPageTextExtracted={onPageTextExtracted} />}
    </>
  );
};

export default PDFViewerWrapper;