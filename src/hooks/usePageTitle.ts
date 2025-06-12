import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to dynamically set the browser tab title based on the current page
 * @param customTitle Optional custom title to override the default page-based title
 */
export const usePageTitle = (customTitle?: string) => {
  const location = useLocation();

  useEffect(() => {
    // Get the page-specific title based on the current route
    const getPageTitle = (): string => {
      if (customTitle) {
        return `Carlos AI - ${customTitle}`;
      }

      switch (location.pathname) {
        case '/':
        case '/rep-performance':
          return 'Carlos AI - Rep Performance';
        case '/account-performance':
          return 'Carlos AI - Account Performance';
        case '/rep-tracker':
          return 'Carlos AI - Rep Tracker';
        case '/my-performance':
          return 'Carlos AI - My Dashboard';
        case '/ai-vera':
          return 'Carlos AI - Vera AI';
        case '/engine-room':
          return 'Carlos AI - Engine Room';
        case '/engine-room/dashboard':
          return 'Carlos AI - Engine Dashboard';
        case '/engine-room/operations':
          return 'Carlos AI - Engine Operations';
        case '/engine-room/approvals':
          return 'Carlos AI - Engine Approvals';
        case '/engine-room/simulator':
          return 'Carlos AI - Rule Simulator';
        case '/engine-room/analytics':
          return 'Carlos AI - Pricing Analytics';
        case '/auth':
          return 'Carlos AI - Authentication';
        default:
          // For unknown routes, show a generic title
          return 'Carlos AI - Dashboard';
      }
    };

    // Set the document title
    document.title = getPageTitle();
  }, [location.pathname, customTitle]);
}; 