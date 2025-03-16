declare global {
  interface Window {
    gtag: (
      command: string,
      conversionId: string,
      params: Record<string, any>
    ) => void;
  }
}

// Track Google Ads conversion
export function trackConversion(
  conversionId: string,
  conversionLabel: string,
  value?: number
) {
  if (!window.gtag) return;

  window.gtag('event', 'conversion', {
    send_to: `${import.meta.env.VITE_GOOGLE_ADS_ID}/${conversionLabel}`,
    value: value,
    currency: 'USD',
  });
}

// Track remarketing event
export function trackRemarketingEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (!window.gtag) return;

  window.gtag('event', eventName, {
    send_to: import.meta.env.VITE_GOOGLE_ADS_ID,
    ...params,
  });
}