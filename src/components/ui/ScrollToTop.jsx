import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const lastFrameId = sessionStorage.getItem('last_viewed_frame_id');
    // If returning to a category / catalog page with a saved frame, do not force scroll to top
    if (lastFrameId && (pathname.startsWith('/category') || pathname === '/' || pathname.startsWith('/contact-lens'))) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
