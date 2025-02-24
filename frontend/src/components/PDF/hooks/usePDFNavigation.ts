import { useState, useEffect, RefObject } from 'react';
import { PageInfo } from '../types';
import { extractTextFromPage } from '../PDFTextExtractor';

interface UsePDFNavigationProps {
  pageInfo: PageInfo;
  setPageInfo: (value: React.SetStateAction<PageInfo>) => void;
  pdfDocRef: RefObject<any>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isCanvasReady: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  onPageChange?: () => void;  // For cleanup callback
  onPageTextExtracted?: (text: string, pageNumber: number) => void;
}

export const usePDFNavigation = ({
  pageInfo,
  setPageInfo,
  pdfDocRef,
  canvasRef,
  isCanvasReady,
  setError,
  setIsLoading,
  onPageChange,
  onPageTextExtracted
}: UsePDFNavigationProps) => {
  const [inputPageNumber, setInputPageNumber] = useState(pageInfo.pageNumber.toString());

  // Page rendering effect
  useEffect(() => {
    if (!isCanvasReady || !pdfDocRef.current || pageInfo.pageNumber < 1) {
      return;
    }

    const renderPage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const page = await pdfDocRef.current.getPage(pageInfo.pageNumber);
        const viewport = page.getViewport({ scale: pageInfo.scale });

        // Extract text using utility
        const extractionResult = await extractTextFromPage(page);
        if (extractionResult.error) {
          console.error('Text extraction error:', extractionResult.error);
        }

            // Extract raw text for chat
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => item.str);
        const rawText = textItems.join(' ');
            // Call the callback with extracted text
        onPageTextExtracted?.(rawText, pageInfo.pageNumber);



        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) {
          throw new Error('Canvas context not available');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render page');
      } finally {
        setIsLoading(false);
      }
    };

    renderPage();
  }, [isCanvasReady, pdfDocRef.current, pageInfo.pageNumber, pageInfo.scale]);

  // Keep input page number in sync
  useEffect(() => {
    setInputPageNumber(pageInfo.pageNumber.toString());
    onPageChange?.();
  }, [pageInfo.pageNumber, onPageChange]);

  const handlePreviousPage = () => {
    if (pageInfo.pageNumber <= 1) return;
    setPageInfo(prev => ({ ...prev, pageNumber: prev.pageNumber - 1 }));
  };

  const handleNextPage = () => {
    if (pageInfo.pageNumber >= pageInfo.totalPages) return;
    setPageInfo(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }));
  };

  const handlePageNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputPageNumber(value);
    
    const newPageNumber = parseInt(value, 10);
    if (!isNaN(newPageNumber) && 
        newPageNumber >= 1 && 
        newPageNumber <= pageInfo.totalPages) {
      setPageInfo(prev => ({ ...prev, pageNumber: newPageNumber }));
    }
  };

  const handlePageInputBlur = () => {
    if (inputPageNumber === '' || 
        parseInt(inputPageNumber, 10) < 1 || 
        parseInt(inputPageNumber, 10) > pageInfo.totalPages) {
      setInputPageNumber(pageInfo.pageNumber.toString());
    }
  };

  return {
    inputPageNumber,
    handlePreviousPage,
    handleNextPage,
    handlePageNumberInput,
    handlePageInputBlur
  };
};