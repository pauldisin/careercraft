export const initAnalytics = (measurementId: string) => {
  if (typeof window === 'undefined') return;

  // Check consent first!
  const consent = localStorage.getItem('cc_cookie_consent');
  if (consent !== 'granted') {
    console.log('[Analytics] Prevented initialization due to lack of cookie consent.');
    return;
  }

  if ((window as any).gtag) return;

  // Inject Google Analytics script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function () {
    (window as any).dataLayer.push(arguments);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', measurementId);
};

const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  let selId = localStorage.getItem('cc_analytics_session_id');
  if (!selId) {
    selId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cc_analytics_session_id', selId);
  }
  return selId;
};

export const triggerAnalyticsIfConsented = async () => {
  if (typeof window === 'undefined') return;

  const consent = localStorage.getItem('cc_cookie_consent');
  if (consent !== 'granted') {
    console.log('[Analytics] Prevented initialization due to lack of cookie consent.');
    return;
  }

  // 1. Try dynamic database setting first
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      if (data.googleAnalyticsId) {
        initAnalytics(data.googleAnalyticsId);
        return;
      }
    }
  } catch (error) {
    console.warn('[Analytics] Failed to fetch dynamic GA Measurement ID:', error);
  }

  // 2. Fallback to compile-time env var
  const gaId = (import.meta as any).env.VITE_GOOGLE_ANALYTICS_ID;
  if (gaId) {
    initAnalytics(gaId);
  }
};

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  if (Boolean((window as any).gtag)) {
    (window as any).gtag('event', eventName, eventParams);
  } else {
    console.log(`[Analytics] ${eventName}`, eventParams);
  }

  // Send real event data to our first-party analytical database table!
  const sessionId = getOrCreateSessionId();
  const currentPath = window.location.pathname;
  const referrer = document.referrer;
  
  let userId: string | null = null;
  try {
    const userStr = localStorage.getItem('careercraft_user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.id) {
        userId = parsed.id;
      }
    }
  } catch (e) {
    // Fail silently
  }

  const payload = {
    event_name: eventName,
    path: currentPath,
    referrer: referrer || null,
    session_id: sessionId,
    user_id: userId,
  };

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).catch(err => {
    console.warn('[Analytics Error] Failed sending event to server:', err);
  });
};
