import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is a mobile device based on screen width
 * @param breakpoint - Optional width threshold for mobile detection (default: 768px)
 * @returns boolean indicating if the viewport is mobile size
 */
export const useMobile = (breakpoint = 768): boolean => {
  // Start with a reasonable default, assuming desktop initially
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if the viewport is below the mobile breakpoint
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set the initial value
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [breakpoint]);

  return isMobile;
};

export default useMobile;
