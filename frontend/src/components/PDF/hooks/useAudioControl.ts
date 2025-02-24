import { useState, useRef, useCallback } from 'react';
import { TextChunk } from '../../Audio/AudioTextProcessor';

interface UseAudioControlProps {
  pdfDocRef: React.RefObject<any>;
  extractTextFromPage: any;
  currentPageNumber: number;
}

export const useAudioControl = ({ pdfDocRef, extractTextFromPage, currentPageNumber }: UseAudioControlProps) => {
  // Refs
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<TextChunk[]>([]);
  const currentChunkIndexRef = useRef(0);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | undefined>();

  const fullCleanup = useCallback(() => {
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
  }, []);

  const pauseAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const playNextChunk = useCallback(async () => {
    if (currentChunkIndexRef.current >= chunksRef.current.length) {
      fullCleanup();
      return;
    }

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    setAudioLoadingProgress(
      Math.round((currentChunkIndexRef.current / chunksRef.current.length) * 100)
    );

    try {
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
    } catch (error) {
      console.error('Error playing chunk:', error);
      setAudioError('Failed to play audio chunk');
      fullCleanup();
    }
  }, [fullCleanup]);

  const handlePlayAudio = async () => {
    try {
      // If already playing, pause
      if (isPlaying && currentAudioRef.current) {
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
      const page = await pdfDocRef.current.getPage(currentPageNumber);
      const extractionResult = await extractTextFromPage(page);
      
      if (extractionResult.error || extractionResult.chunks.length === 0) {
        throw new Error('No text available for audio');
      }

      chunksRef.current = extractionResult.chunks;
      currentChunkIndexRef.current = 0;

      await playNextChunk();

    } catch (error) {
      console.error('Error:', error);
      setIsGeneratingAudio(false);
      setIsPlaying(false);
      setAudioError('Failed to generate or play audio');
    }
  };

  return {
    // States
    isPlaying,
    isGeneratingAudio,
    audioLoadingProgress,
    audioError,
    
    // Actions
    handlePlayAudio,
    pauseAudio,
    fullCleanup,
    
    // Error handling
    setAudioError,
    
    // Refs (if needed externally)
    currentAudioRef,
    chunksRef,
    currentChunkIndexRef
  };
};