import { useEffect, useState } from "react";

interface SplashScreenProps {
  onLoadComplete: () => void;
  minDisplayTime?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadComplete, minDisplayTime = 400 }) => {
  const [shouldHide, setShouldHide] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const getLogoUrl = () => {
    const cloudFrontUrl = import.meta.env.VITE_IMAGES_BASE_URL;
    const logoKey = import.meta.env.VITE_LOGO_S3_KEY || "assets/logo.png";
    if (!cloudFrontUrl) return null;
    return `${cloudFrontUrl}/${logoKey}`;
  };

  const logoUrl = getLogoUrl();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldHide(true);
      setTimeout(() => {
        onLoadComplete();
      }, 300);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [onLoadComplete, minDisplayTime]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        shouldHide ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      style={{
        background: "linear-gradient(160deg, #f8fbff 0%, #eef6f9 30%, #f0f9f7 60%, #f8fbff 100%)",
      }}
    >
      <div className="relative text-center flex flex-col items-center">
        {/* Logo principal - reemplaza el texto "Full Vision" */}
        <div className="mb-8 opacity-0 animate-[splashFadeUp_0.8s_ease-out_0.1s_forwards]">
          <div className="relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Full Vision - Especialistas en Salud Visual"
                className={`relative w-[40rem] h-auto max-h-[70vh] mx-auto object-contain transition-all duration-700 ${
                  logoLoaded ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                onLoad={() => setLogoLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  console.warn("Error cargando logo desde CloudFront:", logoUrl);
                }}
              />
            ) : (
              <div className="relative w-96 h-96 mx-auto flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45" fill="hsl(174 72% 44%)" opacity="0.1" />
                  <path d="M35 50 L50 35 L65 50 L50 65 Z" fill="hsl(205 86% 18%)" />
                  <circle cx="50" cy="50" r="8" fill="white" />
                </svg>
              </div>
            )}
          </div>
        </div>


        {/* Loading bar */}
        <div className="w-48 h-[3px] rounded-full overflow-hidden opacity-0 animate-[splashFadeUp_0.6s_ease-out_0.6s_forwards]"
          style={{ backgroundColor: "hsl(205 86% 18% / 0.08)" }}
        >
          <div
            className="h-full rounded-full animate-[splashProgress_1.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, hsl(205 86% 18%), hsl(174 72% 44%))",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes splashProgress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
};
