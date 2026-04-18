/// <reference types="vite/client" />

declare global {
  interface Window {
    mozheDesktop?: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      selectDirectory: () => Promise<string | null>;
      notify: (title: string, body: string) => Promise<boolean>;
      openPath: (target: string) => Promise<string>;
    };
  }
}

export {};
