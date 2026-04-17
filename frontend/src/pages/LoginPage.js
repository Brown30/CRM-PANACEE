import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/select-marathon');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) { toast.error('Veuillez entrer votre code'); return; }
    setIsLoading(true);
    try {
      await login(code.trim());
      toast.success('Connexion réussie');
      navigate('/select-marathon');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Code invalide');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.3)] mb-5">
            <Lock className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Panacée
          </h1>
          <p className="text-emerald-600 font-semibold text-sm tracking-[0.15em] uppercase mt-1">CRM</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Bienvenue
          </h2>
          <p className="text-sm text-slate-500 mb-6">Entrez votre code pour accéder au système</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                data-testid="login-code-input"
                type="text"
                inputMode="numeric"
                placeholder="Entrez votre code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field text-center text-lg tracking-[0.3em] font-semibold placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                autoFocus
              />
            </div>
            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Connexion
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Panacée CRM - Gestion des formations
        </p>
      </div>
    </div>
  );
}
