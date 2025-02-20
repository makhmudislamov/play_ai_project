'use client';

import React, { useEffect, useState, useRef } from 'react';
import AudioControls from './AudioControls';


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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // PDF document ref to persist between renders
  const pdfDocRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isPdfLibReady, setIsPdfLibReady] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    pageNumber: 1,
    totalPages: 0,
    scale: 1.0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [inputPageNumber, setInputPageNumber] = useState<string>(pageInfo.pageNumber.toString()); 
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | undefined>();
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isGenerated, setIsGenerated] = useState(false);


// Check if canvas is ready
  useEffect(() => {
    if (canvasRef.current) {
    const context = canvasRef.current.getContext('2d');
    if (context) {
        setIsCanvasReady(true);
    }
    }
  }, []);

  // Check if PDF.js is ready
  useEffect(() => {
    if (window.pdfjsLib) {
      
      setIsPdfLibReady(true);
    }
  }, []);

    // Clear intervals on component unmount
    useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);



  // Validate file type
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
        
        // Update state after PDF is loaded
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
        
    // Separate effect for page rendering
    useEffect(() => {
        if (!isCanvasReady || !pdfDocRef.current || pageInfo.pageNumber < 1) {
          
          return;
        }
    
        
        const renderPage = async () => {
          try {
            setIsLoading(true);
            const page = await pdfDocRef.current.getPage(pageInfo.pageNumber);
            const viewport = page.getViewport({ scale: pageInfo.scale });
    
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

    useEffect(() => {
        setInputPageNumber(pageInfo.pageNumber.toString());
      }, [pageInfo.pageNumber]);

    useEffect(() => {
        if (isPlaying) {
            startPlaybackSimulation();
        } else {
            if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
            }
        }
    }, [isPlaying]); // Depend on isPlaying state


      // navigation handlers
      const handlePreviousPage = async () => {
        if (pageInfo.pageNumber <= 1) return;
        
        const newPageNumber = pageInfo.pageNumber - 1;
        setPageInfo(prev => ({ ...prev, pageNumber: newPageNumber }));
        };

        const handleNextPage = async () => {
        if (pageInfo.pageNumber >= pageInfo.totalPages) return;
        
        const newPageNumber = pageInfo.pageNumber + 1;
        setPageInfo(prev => ({ ...prev, pageNumber: newPageNumber }));
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

        // audio handlers
    // const handlePlayAudio = async () => {
    //     setIsGeneratingAudio(true);
    //     // TODO: Implement actual audio generation and playback
    //     console.log('Playing audio for page:', pageInfo.pageNumber);
    //     setIsGeneratingAudio(false);
    // };

    // manual test 
    const handlePlayAudio = async () => {
        if (!isGenerated) {
          // First time generation
          setIsGeneratingAudio(true);
          setAudioError(undefined);
          setAudioLoadingProgress(0);
          setAudioCurrentTime(0);
      
          let progress = 0;
          const loadingInterval = setInterval(() => {
            progress += 10;
            setAudioLoadingProgress(progress);
            
            if (progress >= 100) {
              clearInterval(loadingInterval);
              setIsGeneratingAudio(false);
              setAudioDuration(45);
              setIsGenerated(true); // Mark as generated
              setIsPlaying(true);
              startPlaybackSimulation();
            }
          }, 500);
        } else {
          // Resume playback
          setIsPlaying(true);
          // Will trigger playback through useEffect
        }
      };
      
      const handlePauseAudio = () => {
        setIsPlaying(false);
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      };
      
      const startPlaybackSimulation = () => {
        console.log('Starting playback with current time:', audioCurrentTime);
        
        // Clear existing interval
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      
        // Only start interval if we're in playing state
        if (isPlaying) {
          playbackIntervalRef.current = setInterval(() => {
            setAudioCurrentTime(prev => {
              console.log('Current time:', prev);
              if (prev >= audioDuration) {
                if (playbackIntervalRef.current) {
                  clearInterval(playbackIntervalRef.current);
                  playbackIntervalRef.current = null;
                }
                setIsPlaying(false);
                return 0;
              }
              return prev + 1;
            });
          }, 1000);
        }
      };

    const handleErrorDismiss = () => {
        setAudioError(undefined);
      };



    return (
        <div data-testid="pdf-viewer-container" className="border rounded-lg p-4">
          <div className="flex flex-col items-center">
            {/* Canvas */}
            <canvas 
              ref={canvasRef}
              className={`max-w-full h-auto ${!file ? 'hidden' : ''}`}
              data-testid="pdf-canvas"
            />
            
            {/* Navigation Controls - only show when PDF is loaded */}
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
                            // Reset to current page if input is invalid when focus is lost
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
                        {/*  AudioControls */}
                    <div className="ml-4 border-l pl-4">
                        <AudioControls
                            onPlay={handlePlayAudio}
                            onPause={handlePauseAudio}
                            isLoading={isGeneratingAudio}
                            loadingProgress={audioLoadingProgress}
                            error={audioError}
                            onErrorDismiss={handleErrorDismiss}
                            duration={audioDuration}
                            currentTime={audioCurrentTime}
                            isPlaying={isPlaying}
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