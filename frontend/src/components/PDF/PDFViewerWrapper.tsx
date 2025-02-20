'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import PDFViewer from '@/components/PDF/PDFViewer';
// import PDFViewer from './PDFViewer';  

interface PDFViewerWrapperProps {
  file?: File;
  url?: string;
}

const PDFViewerWrapper: React.FC<PDFViewerWrapperProps> = (props) => {
  const PDFJS_VERSION = '3.11.174'; // Using a stable version
  const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
  const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

  useEffect(() => {
    // Configure worker
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
    }
  }, [WORKER_URL]);

  return (
    <>
      <Script
        src={PDFJS_URL}
        strategy="beforeInteractive"
        onLoad={() => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
        }}
      />
      <PDFViewer {...props} />
    </>
  );
};

export default PDFViewerWrapper;