import { useEffect, useState } from "react";

// Custom type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Component to show PWA install prompt
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallPrompt(false);
    }

    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img src="/logo4.ico" alt="Full Vision" className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Instalar Full Vision</h3>
          <p className="text-sm text-gray-600 mt-1">Instala nuestra app para una experiencia más rápida y acceso offline.</p>
          <div className="flex space-x-2 mt-3">
            <button onClick={installPWA} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              Instalar
            </button>
            <button onClick={() => setShowInstallPrompt(false)} className="text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-100">
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
