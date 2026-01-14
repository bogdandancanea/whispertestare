
'use client';

import { useEffect } from 'react';

// This is a workaround for a common issue on Android Chrome where the
// virtual keyboard covers the input field. This component listens for
// focus events on inputs and textareas and scrolls them into view.
export default function AndroidInputScrollFix() {
  useEffect(() => {
    const isAndroid = /android/i.test(navigator.userAgent);
    if (!isAndroid) {
      return;
    }

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    window.addEventListener('focusin', handleFocus);

    return () => {
      window.removeEventListener('focusin', handleFocus);
    };
  }, []);

  return null;
}
