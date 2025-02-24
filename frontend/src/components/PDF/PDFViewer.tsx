'use client';

import React, { useRef } from 'react';
import AudioControls from '../Audio/AudioControls';
import { PDFViewerProps } from './types';
import { usePDFSetup } from './hooks/usePDFSetup';
import { usePDFNavigation } from './hooks/usePDFNavigation';
import { useAudioControl } from './hooks/useAudioControl';
import { extractTextFromPage } from './PDFTextExtractor';

const PDFViewer: React.FC<PDFViewerProps> = ({ file, url, onPageTextExtracted  }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Setup PDF and canvas
  const {
    error,
    setError,
    isCanvasReady,
    isLoading,
    setIsLoading,
    pageInfo,
    setPageInfo
  } = usePDFSetup(canvasRef, pdfDocRef, file, url);

  // Audio control
  const {
    isPlaying,
    isGeneratingAudio,
    audioLoadingProgress,
    audioError,
    handlePlayAudio,
    fullCleanup,
    setAudioError
  } = useAudioControl({
    pdfDocRef,
    extractTextFromPage,
    currentPageNumber: pageInfo.pageNumber
  });

  // Page navigation
  const {
    inputPageNumber,
    handlePreviousPage,
    handleNextPage,
    handlePageNumberInput,
    handlePageInputBlur
  } = usePDFNavigation({
    pageInfo,
    setPageInfo,
    pdfDocRef,
    canvasRef,
    isCanvasReady,
    setError,
    setIsLoading,
    onPageChange: fullCleanup,
    onPageTextExtracted
  });

  return (
    <div data-testid="pdf-viewer-container" className="border rounded-lg p-4">
      <div className="flex flex-col items-center">
        {/* PDF Canvas */}
        <canvas 
          ref={canvasRef}
          className={`max-w-full h-auto ${!file ? 'hidden' : ''}`}
          data-testid="pdf-canvas"
        />
        
        {/* Navigation Controls */}
        {pageInfo.totalPages > 0 && (
          <div className="mt-4 flex items-center gap-4">
            {/* Previous Button */}
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={pageInfo.pageNumber <= 1}
              onClick={handlePreviousPage}
            >
              Previous
            </button>

            {/* Page Input */}
            <div className="flex items-center gap-2 text-blue-500">
              <input
                type="number"
                min={1}
                max={pageInfo.totalPages}
                value={inputPageNumber}
                onChange={handlePageNumberInput}
                onBlur={handlePageInputBlur}
                className="w-16 px-2 py-1 border border-blue-300 rounded text-center"
                aria-label="Page number"
              />
              <span className="text-sm">
                of {pageInfo.totalPages}
              </span>
            </div>

            {/* Next Button */}
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={pageInfo.pageNumber >= pageInfo.totalPages}
              onClick={handleNextPage}
            >
              Next
            </button>

            {/* Audio Controls */}
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