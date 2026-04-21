import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NoMarathonFallback() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center data-testid='no-marathon-fallback'">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Trophy className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Aucun marathon sélectionné
      </h2>
      <p className="text-slate-500 mb-6 max-w-sm">
        Veuillez sélectionner un marathon existant ou demander à un administrateur d'en créer un pour afficher ces paramètres.
      </p>
      <Button onClick={() => navigate('/select-marathon')}>
        Sélectionner un marathon
      </Button>
    </div>
  );
}
