'use client';

import PDFUpload from '@/components/PDF/PDFUpload';
import PDFViewer from '@/components/PDF/PDFViewer';
import PDFViewerWrapper from '@/components/PDF/PDFViewerWrapper';
import { useState } from 'react';

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | undefined>();
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();

  const handleFileUpload = async (file: File) => {
    // Create a URL for the uploaded file
    const fileUrl = URL.createObjectURL(file);
    setPdfFile(file);
    setPdfUrl(fileUrl);
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">PDF Reader</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl mb-2">Upload PDF</h2>
          <PDFUpload onUpload={handleFileUpload} />
        </div>
        
        <div>
          <h2 className="text-xl mb-2">PDF Viewer</h2>
          <PDFViewerWrapper file={pdfFile} url={pdfUrl} />
        </div>
      </div>
    </main>
  );
}