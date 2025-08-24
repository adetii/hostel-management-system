// ScrollToTopOnRouteChange component
import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();
  const isFirstLoadRef = useRef(true);

  useLayoutEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }
    // On subsequent route changes, keep the smooth behavior
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

export default ScrollToTopOnRouteChange;