export interface TextChunk {
    text: string;
    index: number;
    pageNumber: number;
  }
  
export const prepareTextForAudio = (text: string, pageNumber: number, maxChunkSize: number = 1000): TextChunk[] => {
  try {
    // text cleaning
    const cleanText = text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim();

    // Split into sentences
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    sentences.forEach((sentence) => {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
          pageNumber
        });
        currentChunk = '';
      }
      currentChunk += ' ' + sentence;
    });

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        pageNumber
      });
    }


    return chunks;

  } catch (error) {
    console.error('Error preparing text:', error);
    return [];
  }
};