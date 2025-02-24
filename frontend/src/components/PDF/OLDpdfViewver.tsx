'use client';

import React, { useEffect, useState, useRef } from 'react';
import AudioControls from '../Audio/AudioControls';
import { extractTextFromPage } from './PDFTextExtractor';
import { TextChunk } from '../Audio/AudioTextProcessor';

interface PDFViewerProps {
  file?: File;
  url?: string;
}

interface PageInfo {
  pageNumber: number;
  totalPages: number;
  scale: number;
}


const PDFViewer: React.FC<PDFViewerProps> = ({ file, url }) => {
  // PDF related refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  
  // PDF states
  const [error, setError] = useState<string | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isPdfLibReady, setIsPdfLibReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    pageNumber: 1,
    totalPages: 0,
    scale: 1.0,
  });
  const [inputPageNumber, setInputPageNumber] = useState<string>(pageInfo.pageNumber.toString());

  // Audio related refs and state
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<TextChunk[]>([]);
  const currentChunkIndexRef = useRef(0);
  
  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | undefined>();

  // Basic setup effects
  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        setIsCanvasReady(true);
      }
    }
  }, []);

  useEffect(() => {
    if (window.pdfjsLib) {
      setIsPdfLibReady(true);
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    fullCleanup(); // Immediate cleanup when page changes
    return () => {
      fullCleanup(); // Cleanup when unmounting
    };
  }, [pageInfo.pageNumber]);

  

  // File validation
  useEffect(() => {
    if (file && !file.type.includes('pdf')) {
      setError('Invalid PDF file');
    }
  }, [file]);

  // PDF loading effect
  useEffect(() => {
    if (!url || !isPdfLibReady) return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        
        setPageInfo(prev => ({ 
          ...prev, 
          totalPages: pdf.numPages,
          pageNumber: 1
        }));
      } catch (err) {
        setError('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [url, isPdfLibReady]);

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
  }, [pageInfo.pageNumber]);

  // Navigation handlers
  const handlePreviousPage = () => {
    if (pageInfo.pageNumber <= 1) return;
    fullCleanup();
    setPageInfo(prev => ({ ...prev, pageNumber: prev.pageNumber - 1 }));
  };

  const handleNextPage = () => {
    if (pageInfo.pageNumber >= pageInfo.totalPages) return;
    fullCleanup();
    setPageInfo(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }));
  };

  const handlePageNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputPageNumber(value);
    
    const newPageNumber = parseInt(value, 10);
    if (!isNaN(newPageNumber) && 
        newPageNumber >= 1 && 
        newPageNumber <= pageInfo.totalPages) {
      fullCleanup();
      setPageInfo(prev => ({ ...prev, pageNumber: newPageNumber }));
    }
  };

  // Audio handlers
  const handlePlayAudio = async () => {
    try {
      // If already playing, pause
      if (isPlaying && currentAudioRef.current) {
        // currentAudioRef.current.pause();
        // setIsPlaying(false);
        pauseAudio();
        return;
      }

      // If paused with existing audio, resume
      if (currentAudioRef.current && chunksRef.current.length > 0) {
        setIsPlaying(true);
        await currentAudioRef.current.play();
        return;
      }

      // Start new playback
      setIsGeneratingAudio(true);
      const page = await pdfDocRef.current.getPage(pageInfo.pageNumber);
      const extractionResult = await extractTextFromPage(page);
      
      if (extractionResult.error || extractionResult.chunks.length === 0) {
        throw new Error('No text available for audio');
      }

      chunksRef.current = extractionResult.chunks;
      currentChunkIndexRef.current = 0;

      const playNextChunk = async () => {
        if (currentChunkIndexRef.current >= chunksRef.current.length) {
          // setIsPlaying(false);
          // setIsGeneratingAudio(false);
          fullCleanup();
          return;
        }

        const chunk = chunksRef.current[currentChunkIndexRef.current];
        setAudioLoadingProgress(
          Math.round((currentChunkIndexRef.current / chunksRef.current.length) * 100)
        );

        const response = await fetch('http://localhost:5001/api/tts/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: chunk.text })
        });

        if (!response.ok) throw new Error('Failed to generate audio');

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Clean up previous audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          URL.revokeObjectURL(currentAudioRef.current.src);
        }

        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentChunkIndexRef.current++;
          playNextChunk();
        };

        setIsGeneratingAudio(false);
        setIsPlaying(true);
        await audio.play();
      };

      await playNextChunk();

    } catch (error) {
      console.error('Error:', error);
      setIsGeneratingAudio(false);
      setIsPlaying(false);
      setAudioError('Failed to generate or play audio');
    }
  };

  const fullCleanup = () => {
    // Used for page changes - complete reset
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      URL.revokeObjectURL(currentAudioRef.current.src);
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
    setIsGeneratingAudio(false);
    setAudioLoadingProgress(0);
    currentChunkIndexRef.current = 0;
    chunksRef.current = [];
  };

  const pauseAudio = () => {
    // Used for pause - preserve position and chunks
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsPlaying(false);
  };

  return (
    <div data-testid="pdf-viewer-container" className="border rounded-lg p-4">
      <div className="flex flex-col items-center">
        <canvas 
          ref={canvasRef}
          className={`max-w-full h-auto ${!file ? 'hidden' : ''}`}
          data-testid="pdf-canvas"
        />
        
        {pageInfo.totalPages > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={pageInfo.pageNumber <= 1}
              onClick={handlePreviousPage}
            >
              Previous
            </button>

            <div className="flex items-center gap-2 text-blue-500">
              <input
                type="number"
                min={1}
                max={pageInfo.totalPages}
                value={inputPageNumber}
                onChange={handlePageNumberInput}
                onBlur={() => {
                  if (inputPageNumber === '' || 
                      parseInt(inputPageNumber, 10) < 1 || 
                      parseInt(inputPageNumber, 10) > pageInfo.totalPages) {
                    setInputPageNumber(pageInfo.pageNumber.toString());
                  }
                }}
                className="w-16 px-2 py-1 border border-blue-300 rounded text-center"
                aria-label="Page number"
              />
              <span className="text-sm">
                of {pageInfo.totalPages}
              </span>
            </div>

            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={pageInfo.pageNumber >= pageInfo.totalPages}
              onClick={handleNextPage}
            >
              Next
            </button>

            <div className="ml-4 border-l pl-4">
              <AudioControls
                onPlay={handlePlayAudio}
                onPause={handlePlayAudio}
                isLoading={isGeneratingAudio}
                loadingProgress={audioLoadingProgress}
                error={audioError}
                isPlaying={isPlaying}
                onErrorDismiss={() => setAudioError(undefined)}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error ? (
          <p className="text-red-500 text-center mt-4">{error}</p>
        ) : !file ? (
          <p className="text-gray-500 text-center mt-4">
            No PDF file selected
          </p>
        ) : isLoading && (
          <div className="flex items-center justify-center mt-4">
            <p className="text-blue-500">Loading PDF...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;