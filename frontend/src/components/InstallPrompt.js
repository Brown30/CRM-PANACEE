import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if dismissed
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) return;

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone;
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
      localStorage.setItem('installPromptDismissed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[72px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-white shadow-xl shadow-slate-200/50 border border-slate-200 rounded-2xl p-4 z-50 flex items-start gap-4 animate-in slide-in-from-bottom-5">
      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900">Installer l'application</h3>
        <p className="text-xs text-slate-500 mt-1">
          {isIOS 
            ? 'Pour installer, touchez Partager puis "Sur l\'écran d\'accueil".'
            : 'Installez Panacée CRM pour un accès rapide et hors-ligne.'
          }
        </p>
        {!isIOS && (
          <Button 
            className="w-full mt-3 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs" 
            onClick={handleInstall}
          >
            Installer
          </Button>
        )}
      </div>
      <button 
        onClick={handleDismiss} 
        className="text-slate-400 hover:text-slate-600 shrink-0 -mt-1 -mr-1 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
