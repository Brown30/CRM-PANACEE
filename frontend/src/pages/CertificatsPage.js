import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Award, Calendar, Trophy, Download, Pencil, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { buildCertificatePdf, slugifyFileName, CERTIFICATE_TEMPLATES } from '@/lib/certificate';

export default function CertificatsPage() {
  const { api, isPedagogia, isAdmin } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', birth_date: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: marathonsData } = await api.get('/marathons/all');
      const marathons = marathonsData.marathons || [];
      const results = await Promise.all(marathons.map(async (m) => {
        const { data } = await api.get('/leads', { params: { marathon_id: m.id, status: 'Inscrit' } });
        return { marathon: m, students: data.leads || [] };
      }));
      setGroups(results.filter(g => g.students.length > 0));
    } catch {
      toast.error('Erreur chargement');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (student) => {
    setEditingStudent(student);
    setEditForm({ email: student.email || '', birth_date: student.birth_date || '' });
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/leads/${editingStudent.id}`, editForm);
      toast.success('Informations mises à jour');
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleGenerate = async (student, marathon) => {
    if (!CERTIFICATE_TEMPLATES[marathon.formation]) {
      toast.error(`Aucun modèle de certificat pour "${marathon.formation}"`);
      return;
    }
    setGeneratingId(student.id);
    try {
      const dateStr = new Date().toLocaleDateString('fr-FR');
      const verifyUrl = `${window.location.origin}/verificar/${student.id}`;
      const pdf = await buildCertificatePdf({
        fullName: student.full_name,
        formation: marathon.formation,
        dateStr,
        verifyUrl
      });
      pdf.save(`Certificat_${slugifyFileName(student.full_name)}.pdf`);
      await api.put(`/leads/${student.id}`, { certified: true, certificate_date: new Date().toISOString().split('T')[0] });
      toast.success('Certificat généré');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur génération certificat');
    }
    setGeneratingId(null);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="certificats-page">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Award className="w-5 h-5 text-emerald-500" /> Certificats
      </h2>

      {groups.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">Aucun élève inscrit pour le moment</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5">
        <Accordion type="single" collapsible>
          {groups.map(({ marathon, students }) => {
            const certifiedCount = students.filter(s => s.certified).length;
            return (
              <AccordionItem key={marathon.id} value={marathon.id}>
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 w-full pr-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-slate-800 text-sm">{marathon.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {marathon.formation} · {marathon.start_date || '?'} → {marathon.end_date || '?'}
                      </p>
                    </div>
                    <span className="hidden sm:inline text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium shrink-0">
                      {certifiedCount}/{students.length} certifiés
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {students.map(student => (
                      <div key={student.id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3" data-testid={`certificat-student-${student.id}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{student.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {student.email || 'Email non renseigné'} · {student.birth_date || 'Date de naissance non renseignée'}
                          </p>
                          {student.certified && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Certifié le {student.certificate_date || '—'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(isAdmin || isPedagogia) && (
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600 h-8 w-8" onClick={() => openEdit(student)} title="Modifier email / date de naissance">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {isPedagogia && (
                            <Button
                              size="sm"
                              className="btn-primary h-8 text-xs flex items-center gap-1"
                              onClick={() => handleGenerate(student, marathon)}
                              disabled={generatingId === student.id}
                              data-testid={`generate-certificate-${student.id}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              {generatingId === student.id ? '...' : student.certified ? 'Régénérer' : 'Générer'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Informations de l'élève</DialogTitle>
            <DialogDescription>{editingStudent?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1">Email</Label>
              <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input-field mt-1" placeholder="email@exemple.com" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date de naissance
              </Label>
              <Input type="date" value={editForm.birth_date} onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })} className="input-field mt-1" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setEditingStudent(null)}>Annuler</Button>
              <Button type="button" className="btn-primary flex-1" onClick={handleSaveEdit}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
