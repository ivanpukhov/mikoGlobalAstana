import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureAttribution, trackEvent } from '../utils/analytics';

export const useAnalyticsPageTracking = (enabled = true) => {
    const location = useLocation();

    useEffect(() => {
        if (!enabled) {
            return;
        }

        captureAttribution();
        trackEvent('page_view', {
            path: `${location.pathname}${location.search}`,
        });
    }, [enabled, location.pathname, location.search]);
};
