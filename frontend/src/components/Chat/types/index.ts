
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