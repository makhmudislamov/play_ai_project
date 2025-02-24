import React, { useState } from 'react';

interface AudioControlsProps {
  onPlay: () => void;
  onPause: () => void;
  isLoading?: boolean;
  loadingProgress?: number;
  error?: string;
  onErrorDismiss?: () => void;
  duration?: number;        // Total duration in seconds
  currentTime?: number;     // Current playback time in seconds
  isPlaying?: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({ 
  onPlay, 
  onPause, 
  isLoading = false,
  loadingProgress = 0,
  error,
  onErrorDismiss,
  duration = 0,
  currentTime = 0,
  isPlaying = false,
}) => {
  // const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
    // setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <div className="flex items-center text-red-500 gap-2">
          <span>{error}</span>
          <button 
            onClick={onErrorDismiss}
            className="text-sm hover:text-red-700"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      ) : isLoading && !isPlaying ? (
        <div className="flex items-center text-blue-500">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating audio... {loadingProgress > 0 && `${loadingProgress}%`}
        </div>
      ) : (
        <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <>
              <PauseIcon /> Pause
            </>
          ) : (
            <>
              <PlayIcon /> Play
            </>
          )}
        </button>
        
        {/* Only show time when duration exists */}
        {duration > 0 && (
          <span className="text-sm text-blue-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
        </div>
      )}
    </div>
  );
};

// Simple icon components
const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AudioControls;