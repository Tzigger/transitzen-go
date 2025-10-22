import { ReactNode, useEffect, useState } from "react";
import LandingPage from "@/pages/LandingPage";

interface MobileOnlyProps {
  children: ReactNode;
}

const MobileOnly = ({ children }: MobileOnlyProps) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      // Desktop is > 1024px (larger than tablets)
      setIsDesktop(window.innerWidth > 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (isDesktop) {
    return <LandingPage />;
  }

  return <>{children}</>;
};

export default MobileOnly;
