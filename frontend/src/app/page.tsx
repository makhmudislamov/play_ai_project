'use client';

import PDFUpload from '@/components/PDF/PDFUpload';
import PDFViewerWrapper from '@/components/PDF/PDFViewerWrapper';
import ChatWidget from '@/components/Chat/ChatWidget';
import ClientChatWidget from '@/components/Chat/ClientChatWidget';
import { useState, useEffect } from 'react';

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | undefined>();
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const [isPdfJsReady, setIsPdfJsReady] = useState(false);
  
  const [currentPageText, setCurrentPageText] = useState<string>('');
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);

  useEffect(() => {
  }, [pdfFile, currentPageText, currentPageNumber]);

  const handleFileUpload = async (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setPdfFile(file);
    setPdfUrl(fileUrl);
  };

  

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Play AI - Listen to PDFs with AI Voice</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl mb-2">Upload PDF</h2>
          <PDFUpload onUpload={handleFileUpload} />
          
          {isPdfJsReady && 
          (
            <ClientChatWidget 
              hasPdf={!!pdfFile}
              currentPageText={currentPageText}
              currentPageNumber={currentPageNumber}
            />
          )}
        </div>
        
        <div>
          <h2 className="text-xl mb-2">PDF Viewer</h2>
          <PDFViewerWrapper 
            file={pdfFile} 
            url={pdfUrl} 
            onPdfJsReady={() => setIsPdfJsReady(true)}
            onPageTextExtracted={(text, pageNumber) => {
              setCurrentPageText(text);
              setCurrentPageNumber(pageNumber);
            }}
          />
        </div>
      </div>
    </main>
  );
}