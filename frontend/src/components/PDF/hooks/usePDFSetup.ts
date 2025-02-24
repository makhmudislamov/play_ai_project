import { useEffect, useState, RefObject } from 'react';
import { PageInfo } from '../types';

export const usePDFSetup = (
  canvasRef: RefObject<HTMLCanvasElement>,
  pdfDocRef: RefObject<any>,
  file?: File,
  url?: string
) => {
  const [error, setError] = useState<string | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isPdfLibReady, setIsPdfLibReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    pageNumber: 1,
    totalPages: 0,
    scale: 1.0,
  });

  // Canvas setup
  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        setIsCanvasReady(true);
      }
    }
  }, []);

  // PDF.js ready check
  useEffect(() => {
    if (window.pdfjsLib) {
      setIsPdfLibReady(true);
    }
  }, []);

  // File validation
  useEffect(() => {
    if (file && !file.type.includes('pdf')) {
      setError('Invalid PDF file');
    }
  }, [file]);

  // PDF loading
  useEffect(() => {
    if (!url || !isPdfLibReady) return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        pdfDocRef.current = pdf;
        
        setPageInfo(prev => {
          const newState = { 
            ...prev, 
            totalPages: pdf.numPages,
            pageNumber: 1
          };
          
          return newState;
        });
      } catch (err) {
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [url, isPdfLibReady]);

  return {
    error,
    setError,
    isCanvasReady,
    isPdfLibReady,
    isLoading,
    setIsLoading,
    pageInfo,
    setPageInfo
  };
};