export interface TalkButtonConfig {
  apiKey?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
}

declare global {
  interface Window {
    FloatingTalkButton: {
      init: (config?: TalkButtonConfig) => void;
      destroy: () => void;
    };
  }
} 