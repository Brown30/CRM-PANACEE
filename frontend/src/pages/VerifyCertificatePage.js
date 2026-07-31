import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ShieldCheck, ShieldX, Award } from 'lucide-react';

export default function VerifyCertificatePage() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading');
  const [info, setInfo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: leadData } = await api.get(`/leads/${id}`);
        const lead = leadData.lead;
        if (!lead || !lead.certified) {
          setStatus('not_found');
          return;
        }
        const { data: marathonData } = await api.get(`/marathons/${lead.marathon_id}`);
        setInfo({
          full_name: lead.full_name,
          formation: marathonData.marathon?.formation || '',
          certificate_date: lead.certificate_date
        });
        setStatus('found');
      } catch {
        setStatus('not_found');
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Award className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Panacée <span className="text-emerald-500">Éducation</span>
          </h1>
        </div>

        {status === 'loading' && (
          <div className="py-8">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {status === 'found' && (
          <div className="space-y-3">
            <ShieldCheck className="w-14 h-14 text-emerald-500 mx-auto" />
            <p className="text-sm text-slate-500">Certificat vérifié et authentique</p>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {info.full_name}
            </h2>
            <p className="text-sm text-slate-600">a conclu avec succès la formation</p>
            <p className="text-sm font-semibold text-emerald-600">{info.formation}</p>
            {info.certificate_date && (
              <p className="text-xs text-slate-400 mt-4">Délivré le {info.certificate_date}</p>
            )}
          </div>
        )}

        {status === 'not_found' && (
          <div className="space-y-3">
            <ShieldX className="w-14 h-14 text-red-400 mx-auto" />
            <p className="text-sm text-slate-500">Ce certificat n'a pas pu être vérifié</p>
          </div>
        )}
      </div>
    </div>
  );
}
