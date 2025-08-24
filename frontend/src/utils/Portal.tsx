import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure a single, stable portal container
    let el = document.getElementById('portal-root') as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'portal-root';
      // Style optional, but makes it clear it's for overlays
      el.style.position = 'relative';
      document.body.appendChild(el);
    }
    setContainer(el);
    setMounted(true);

    // Note: Do NOT remove el on unmount — other portals may still use it
    return () => {
      setMounted(false);
    };
  }, []);

  return mounted && container ? createPortal(children, container) : null;
};

export default Portal;