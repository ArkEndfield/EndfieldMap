import { useCallback, useState } from 'react';

interface UsePiPOptions {
  onOpen?: (window: Window) => void;
  onClose?: () => void;
}

export function usePiP({ onOpen, onClose }: UsePiPOptions = {}) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  // 环境能力探测结果在一次会话内不变，直接在渲染期求值。
  const isSupported =
    typeof window !== 'undefined' && 'documentPictureInPicture' in window && !!window.documentPictureInPicture;

  const requestPiP = useCallback(
    async (width: number, height: number) => {
      if (!isSupported || !window.documentPictureInPicture) return;

      try {
        const windowProxy = await window.documentPictureInPicture.requestWindow({
          width,
          height,
        });

        // Copy style sheets
        // This is crucial for maintaining the look and feel in the PiP window
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((styleSheet) => {
          try {
            if (styleSheet.cssRules) {
              const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
              const style = document.createElement('style');
              style.textContent = cssRules;
              windowProxy.document.head.appendChild(style);
            }
          } catch (_e) {
            // Fallback for cross-origin stylesheets or if cssRules access is denied
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.type = styleSheet.type;
              link.media = styleSheet.media.toString();
              link.href = styleSheet.href;
              windowProxy.document.head.appendChild(link);
            }
          }
        });

        // Copy styles from head that might be injected by libraries (like emotion, styled-components)
        Array.from(document.head.querySelectorAll('style')).forEach((style) => {
          windowProxy.document.head.appendChild(style.cloneNode(true));
        });

        // Ensure body key styles
        const baseStyle = document.createElement('style');
        baseStyle.textContent = `
          html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          #root {
            height: 100%;
            width: 100%;
          }
        `;
        windowProxy.document.head.appendChild(baseStyle);

        // Handle closing
        windowProxy.onpagehide = () => {
          setPipWindow(null);
          if (onClose) {
            onClose();
          }
        };

        setPipWindow(windowProxy);
        if (onOpen) {
          onOpen(windowProxy);
        }
      } catch (err) {
        console.error('Failed to open PiP window:', err);
      }
    },
    [isSupported, onClose, onOpen]
  );

  const closePiP = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      onClose?.();
    }
  }, [pipWindow, onClose]);

  return {
    isSupported,
    pipWindow,
    requestPiP,
    closePiP,
    isActive: !!pipWindow,
  };
}
