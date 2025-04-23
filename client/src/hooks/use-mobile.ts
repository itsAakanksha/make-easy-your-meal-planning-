import { useState, useEffect } from "react";

export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== "undefined") {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < breakpoint);
      };

      // Set initial value
      checkIfMobile();

      // Add event listener for window resize
      window.addEventListener("resize", checkIfMobile);

      // Clean up event listener
      return () => {
        window.removeEventListener("resize", checkIfMobile);
      };
    }
  }, [breakpoint]); // Re-run if breakpoint changes

  return isMobile;
}
