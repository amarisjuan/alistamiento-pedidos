import { useEffect, useState } from 'react';

const MOBILE_REGEX = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;

function getIsMobile() {
  if (typeof navigator !== 'undefined' && MOBILE_REGEX.test(navigator.userAgent)) {
    return true;
  }

  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768;
  }

  return false;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getIsMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
