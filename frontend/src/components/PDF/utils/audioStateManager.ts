import { TextChunk } from '../../Audio/AudioTextProcessor';

interface AudioStateManagerConfig {
  onStateChange?: (state: {
    isPlaying: boolean;
    isGeneratingAudio: boolean;
    loadingProgress: number;
  }) => void;
  onError?: (error: string) => void;
}

export class AudioStateManager {
  private currentAudio: HTMLAudioElement | null = null;
  private chunks: TextChunk[] = [];
  private currentChunkIndex: number = 0;
  private config: AudioStateManagerConfig;

  constructor(config: AudioStateManagerConfig = {}) {
    this.config = config;
  }

  async generateAudio(text: string): Promise<string> {
    const response = await fetch('http://localhost:5001/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }

  setChunks(chunks: TextChunk[]) {
    this.chunks = chunks;
    this.currentChunkIndex = 0;
  }

  getCurrentChunk(): TextChunk | null {
    return this.chunks[this.currentChunkIndex] || null;
  }

  getProgress(): number {
    if (this.chunks.length === 0) return 0;
    return Math.round((this.currentChunkIndex / this.chunks.length) * 100);
  }

  async playNextChunk(): Promise<void> {
    try {
      if (this.currentChunkIndex >= this.chunks.length) {
        this.fullCleanup();
        return;
      }

      const chunk = this.getCurrentChunk();
      if (!chunk) return;

      this.config.onStateChange?.({
        isPlaying: true,
        isGeneratingAudio: true,
        loadingProgress: this.getProgress()
      });

      const audioUrl = await this.generateAudio(chunk.text);
      
      // Cleanup previous audio
      this.cleanupCurrentAudio();

      // Setup new audio
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentChunkIndex++;
        this.playNextChunk();
      };

      this.config.onStateChange?.({
        isPlaying: true,
        isGeneratingAudio: false,
        loadingProgress: this.getProgress()
      });

      await audio.play();
    } catch (error) {
      this.config.onError?.('Failed to play audio chunk');
      this.fullCleanup();
    }
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.config.onStateChange?.({
        isPlaying: false,
        isGeneratingAudio: false,
        loadingProgress: this.getProgress()
      });
    }
  }

  async resume(): Promise<void> {
    if (this.currentAudio) {
      await this.currentAudio.play();
      this.config.onStateChange?.({
        isPlaying: true,
        isGeneratingAudio: false,
        loadingProgress: this.getProgress()
      });
    }
  }

  private cleanupCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      URL.revokeObjectURL(this.currentAudio.src);
      this.currentAudio = null;
    }
  }

  fullCleanup(): void {
    this.cleanupCurrentAudio();
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.config.onStateChange?.({
      isPlaying: false,
      isGeneratingAudio: false,
      loadingProgress: 0
    });
  }

  isPlaying(): boolean {
    return !!this.currentAudio && !this.currentAudio.paused;
  }

  hasChunks(): boolean {
    return this.chunks.length > 0;
  }
}

export const createAudioStateManager = (config?: AudioStateManagerConfig) => {
  return new AudioStateManager(config);
};