export interface PDFViewerProps {
    file?: File;
    url?: string;
    onPageTextExtracted?: (text: string, pageNumber: number) => void;
  }
  
  export interface PageInfo {
    pageNumber: number;
    totalPages: number;
    scale: number;
  }
  
  export interface AudioState {
    isPlaying: boolean;
    isGeneratingAudio: boolean;
    audioLoadingProgress: number;
    audioError?: string;
  }


  export interface ChatContextData {
    pageText: string;
    pageNumber: number;
  }

  export interface ChatState {
    isReady: boolean;
    currentContext?: ChatContextData;
  }

  export interface AgentController {
    conversationId: string;
    mute: () => void;
    unmute: () => void;
    hangup: () => void;
  }

  export interface AgentState {
      isConnected: boolean;
      isLoading: boolean;
      error?: string;
}
