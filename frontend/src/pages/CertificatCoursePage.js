import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Users, Trophy, Calendar, Mail, Download, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';
import { buildCertificatePdf, slugifyFileName, CERTIFICATE_TEMPLATES } from '@/lib/certificate';

export default function CertificatCoursePage() {
  const { marathonId } = useParams();
  const navigate = useNavigate();
  const { api, isPedagogia, isAdmin } = useAuth();
  const [marathon, setMarathon] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ficheStudent, setFicheStudent] = useState(null);
  const [ficheForm, setFicheForm] = useState({ email: '', birth_date: '' });
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: marathonData }, { data: leadsData }] = await Promise.all([
        api.get(`/marathons/${marathonId}`),
        api.get('/leads', { params: { marathon_id: marathonId, status: 'Participant' } })
      ]);
      setMarathon(marathonData.marathon);
      setStudents(leadsData.leads || []);
    } catch {
      toast.error('Erreur chargement');
    }
    setLoading(false);
  }, [api, marathonId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openFiche = (student) => {
    setFicheStudent(student);
    setFicheForm({ email: student.email || '', birth_date: student.birth_date || '' });
  };

  const handleSaveFiche = async () => {
    try {
      await api.put(`/leads/${ficheStudent.id}`, ficheForm);
      toast.success('Informations mises à jour');
      const updated = { ...ficheStudent, ...ficheForm };
      setFicheStudent(updated);
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleGenerate = async () => {
    if (!CERTIFICATE_TEMPLATES[marathon.formation]) {
      toast.error(`Aucun modèle de certificat pour "${marathon.formation}"`);
      return;
    }
    setGenerating(true);
    try {
      const dateStr = new Date().toLocaleDateString('fr-FR');
      const verifyUrl = `${window.location.origin}/verificar/${ficheStudent.id}`;
      const pdf = await buildCertificatePdf({
        fullName: ficheStudent.full_name,
        formation: marathon.formation,
        dateStr,
        verifyUrl
      });
      pdf.save(`Certificat_${slugifyFileName(ficheStudent.full_name)}.pdf`);
      const certificate_date = new Date().toISOString().split('T')[0];
      await api.put(`/leads/${ficheStudent.id}`, { certified: true, certificate_date });
      const updated = { ...ficheStudent, certified: true, certificate_date };
      setFicheStudent(updated);
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success('Certificat généré');
    } catch (err) {
      toast.error(err.message || 'Erreur génération certificat');
    }
    setGenerating(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!marathon) return null;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="certificat-course-page">
      <button onClick={() => navigate('/certificats')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour aux cours
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{marathon.name}</h2>
            <p className="text-sm text-slate-500">{marathon.formation}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {students.length} participant{students.length > 1 ? 's' : ''}</span>
          {marathon.start_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {marathon.start_date} → {marathon.end_date || '...'}</span>}
        </div>
      </div>

      <div className="space-y-2">
        {students.map(student => (
          <button
            key={student.id}
            onClick={() => openFiche(student)}
            className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all text-left"
            data-testid={`certificat-student-${student.id}`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{student.full_name}</p>
              {student.certified && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Certifié le {student.certificate_date || '—'}
                </p>
              )}
            </div>
          </button>
        ))}
        {students.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium">Aucun participant pour ce cours</p>
          </div>
        )}
      </div>

      {/* Ficha do aluno */}
      <Dialog open={!!ficheStudent} onOpenChange={(open) => !open && setFicheStudent(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>{ficheStudent?.full_name}</DialogTitle>
            <DialogDescription>Fiche de l'élève</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input value={ficheForm.email} onChange={e => setFicheForm({ ...ficheForm, email: e.target.value })} className="input-field mt-1" placeholder="email@exemple.com" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date de naissance
              </Label>
              <Input type="date" value={ficheForm.birth_date} onChange={e => setFicheForm({ ...ficheForm, birth_date: e.target.value })} className="input-field mt-1" />
            </div>
            {(isAdmin || isPedagogia) && (
              <Button type="button" variant="outline" className="w-full h-10 rounded-xl text-sm" onClick={handleSaveFiche}>
                Enregistrer les informations
              </Button>
            )}

            {ficheStudent?.certified && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" /> Certifié le {ficheStudent.certificate_date || '—'}
              </p>
            )}

            {isPedagogia && (
              <Button
                type="button"
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleGenerate}
                disabled={generating}
                data-testid="fiche-generate-certificate"
              >
                <Download className="w-4 h-4" />
                {generating ? 'Génération...' : ficheStudent?.certified ? 'Régénérer le certificat' : 'Générer le certificat'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
