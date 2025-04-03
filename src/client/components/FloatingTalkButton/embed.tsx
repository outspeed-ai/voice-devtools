import React from 'react';
import { createRoot } from 'react-dom/client';
import FloatingTalkButton from './FloatingTalkButton';

class TalkButtonEmbed {
  private container: HTMLElement | null = null;
  private root: ReturnType<typeof createRoot> | null = null;

  constructor(config = {}) {
    this.init(config);
  }

  private init(config: any) {
    // Clean up any existing instance
    this.destroy();

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'floating-talk-button-root';
    document.body.appendChild(this.container);

    // Initialize React
    this.root = createRoot(this.container);
    this.root.render(
      <React.StrictMode>
        <FloatingTalkButton />
      </React.StrictMode>
    );
  }

  public destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Export global API
window.FloatingTalkButton = {
  init: (config = {}) => new TalkButtonEmbed(config),
  destroy: () => {
    // Implementation if needed
  },
}; 