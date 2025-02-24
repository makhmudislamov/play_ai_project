import { prepareTextForAudio, TextChunk } from '../Audio/AudioTextProcessor';


interface CachedPage {
    chunks: TextChunk[];
    timestamp: number;
}

export interface TextExtractionResult {
    chunks: TextChunk[];
    pageNumber: number;
    error?: string;
}

class TextCache {
    private cache = new Map<number, CachedPage>();
    private readonly MAX_CACHE_SIZE = 20;  // Store max 20 pages
    private readonly CACHE_EXPIRY = 30 * 60 * 1000;  // 30 minutes in milliseconds
  
    set(pageNumber: number, chunks: TextChunk[]) {
      // Remove oldest entry if cache is full
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.findOldestEntry();
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
  
      this.cache.set(pageNumber, {
        chunks,
        timestamp: Date.now()
      });
    }
  
    get(pageNumber: number): TextChunk[] | null {
      const cached = this.cache.get(pageNumber);
      
      if (!cached) return null;
  
      // Check if cache has expired
      if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(pageNumber);
        return null;
      }
  
      return cached.chunks;
    }
  
    private findOldestEntry(): number | null {
      let oldestKey = null;
      let oldestTime = Infinity;
  
      for (const [key, value] of this.cache.entries()) {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      }
  
      return oldestKey;
    }
  
    clear() {
      this.cache.clear();
    }
  }
  
  const textCache = new TextCache();
  
  export const extractTextFromPage = async (pdfPage: any): Promise<TextExtractionResult> => {
    const pageNumber = pdfPage.pageNumber;
  
    // Check cache first
    const cachedChunks = textCache.get(pageNumber);
    if (cachedChunks) {
    //   console.log('Using cached text for page:', pageNumber);
      return {
        chunks: cachedChunks,
        pageNumber
      };
    }
  
    try {
      const textContent = await pdfPage.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str);
      const rawText = textItems.join(' ');
      
      const chunks = prepareTextForAudio(rawText, pageNumber);
      
      // Cache the result
      textCache.set(pageNumber, chunks);
  
      return {
        chunks,
        pageNumber
      };
    } catch (error) {
      console.error('Error extracting text:', error);
      return {
        chunks: [],
        pageNumber,
        error: 'Failed to extract text from page'
      };
    }
  };