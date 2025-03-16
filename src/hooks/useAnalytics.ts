import { useEffect } from 'react';
import { trackPageView, trackEvent } from '../lib/analytics';

export function useAnalytics() {
  // Track page views
  useEffect(() => {
    // Track initial page view
    trackPageView(window.location.pathname);

    // Track page views on navigation
    const handleRouteChange = () => {
      trackPageView(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return {
    trackEvent,
  };
}