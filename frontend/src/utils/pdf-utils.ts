import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface PDFPageInfo {
  pageNumber: number;
  totalPages: number;
  scale: number;
}

export const loadPDF = async (url: string): Promise<PDFDocumentProxy> => {
    try {
      console.log('loadPDF called with URL:', url);
      const pdf = await getDocument(url).promise;
      return pdf;
    } catch (error) {
      console.error('Error in loadPDF:', error);
      throw error;
    }
  };

export const renderPage = async (
  canvas: HTMLCanvasElement,
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.0
): Promise<PDFPageInfo> => {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return {
      pageNumber,
      totalPages: pdf.numPages,
      scale,
    };
  } catch (error) {
    console.error('Error rendering page:', error);
    throw new Error('Failed to render PDF page');
  }
};