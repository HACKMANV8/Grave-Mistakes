import { useEffect } from 'react';

export default function ScrollToTop() {
  useEffect(() => {
    // Force scroll to top on mount/reload
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Execute immediately
    scrollToTop();

    // Also execute on page show (handles back/forward navigation)
    window.addEventListener('pageshow', scrollToTop);
    
    // Execute on beforeunload to ensure position resets
    window.addEventListener('beforeunload', scrollToTop);

    return () => {
      window.removeEventListener('pageshow', scrollToTop);
      window.removeEventListener('beforeunload', scrollToTop);
    };
  }, []);

  return null;
}
