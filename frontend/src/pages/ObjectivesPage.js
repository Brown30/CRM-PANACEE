import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ClipboardList, Phone, Target, Wallet } from 'lucide-react';
import { performancePlans, getPlanByName } from '@/data/performancePlans';

const fmtHTG = (n) => `${n.toLocaleString('fr-FR')} HTG`;

function ObjectiveBlock({ objectif }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-4 space-y-3">
      <h4 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {objectif.titre}
      </h4>
      <p className="text-xs text-slate-500">{objectif.periode}</p>

      <div>
        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
          <Phone className="w-3.5 h-3.5" /> Plan d'appels
        </p>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
          {objectif.planAppels.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <ul className="text-xs text-slate-400 mt-1 space-y-0.5">
          {objectif.calculDetaille.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <p className="text-sm font-bold text-emerald-600 mt-1">Total : {objectif.totalAppels} appels</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
          <Target className="w-3.5 h-3.5" /> Objectif commercial
        </p>
        <p className="text-xs text-slate-600">Objectif minimum : <strong>{objectif.objectifMinInscriptions} inscriptions</strong></p>
        <p className="text-xs text-slate-600">Taux de conversion minimum : <strong>{objectif.tauxConversionMin}</strong></p>
        <p className="text-xs text-slate-400">{objectif.conversionNote}</p>
        <p className="text-xs text-slate-600 mt-1">
          Projection excellente ({objectif.projectionExcellente.taux}) : <strong>≈ {objectif.projectionExcellente.inscriptions} inscriptions</strong>
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1">
          <Wallet className="w-3.5 h-3.5" /> Commission
        </p>
        <p className="text-xs text-slate-600">
          Inscription : {objectif.commission.inscription.qte} × {objectif.commission.inscription.unitaire} HTG = <strong>{fmtHTG(objectif.commission.inscription.total)}</strong>
        </p>
        <p className="text-xs text-slate-600">
          Participation : {objectif.commission.participation.participants} × {objectif.commission.participation.unitaire} HTG = <strong>{fmtHTG(objectif.commission.participation.total)}</strong>
          {objectif.commission.participation.tauxParticipation && ` (${objectif.commission.participation.tauxParticipation} de participation estimée)`}
        </p>
        <p className="text-sm font-bold text-emerald-600 mt-1">Total : {fmtHTG(objectif.commission.total)}</p>
      </div>
    </div>
  );
}

function PlanContent({ plan }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500">{plan.periode}</p>
        <p className="text-sm text-slate-600 mt-1">Formation principale : <strong>{plan.formationPrincipale}</strong></p>
        {plan.missionSecondaire && (
          <p className="text-sm text-slate-600">Mission secondaire : <strong>{plan.missionSecondaire}</strong></p>
        )}
        <p className="text-sm text-slate-600">Salaire fixe : <strong className="text-emerald-600">{fmtHTG(plan.salaireFixe)}</strong></p>
      </div>

      <div className="space-y-3">
        {plan.objectifs.map((o, i) => (
          <ObjectiveBlock key={i} objectif={o} />
        ))}
      </div>

      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
        <p className="text-xs font-semibold text-emerald-700 mb-2">Revenu estimé</p>
        {plan.revenuEstime.lignes.map(([label, val], i) => (
          <p key={i} className="text-xs text-emerald-700 flex justify-between">
            <span>{label}</span><span className="font-semibold">{fmtHTG(val)}</span>
          </p>
        ))}
        <div className="border-t border-emerald-200 mt-2 pt-2 flex justify-between">
          <span className="text-sm font-semibold text-emerald-800">Revenu total estimé</span>
          <span className="text-sm font-bold text-emerald-800">{fmtHTG(plan.revenuEstime.total)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <tbody>
            {plan.recap.map(([label, val], i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 text-slate-500">{label}</td>
                <td className="py-1.5 text-right font-semibold text-slate-800">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 whitespace-pre-line italic border-l-2 border-emerald-300 pl-3">
        {plan.motFinal}
      </div>
    </div>
  );
}

export default function ObjectivesPage() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    const plan = getPlanByName(user?.name);
    return (
      <div className="p-4 md:p-6 space-y-4" data-testid="objectives-page">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <ClipboardList className="w-5 h-5 text-emerald-500" /> Instructions et Objectifs
        </h2>
        {plan ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{plan.name}</h3>
            <PlanContent plan={plan} />
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun plan de performance défini pour le moment</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="objectives-page">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <ClipboardList className="w-5 h-5 text-emerald-500" /> Instructions et Objectifs
      </h2>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5">
        <Accordion type="single" collapsible>
          {performancePlans.map((plan) => (
            <AccordionItem key={plan.name} value={plan.name} data-testid={`objectives-item-${plan.name}`}>
              <AccordionTrigger>
                <div className="flex items-center justify-between w-full pr-3">
                  <span className="font-semibold text-slate-800">{plan.name}</span>
                  <span className="text-xs text-slate-400">
                    Salaire fixe {fmtHTG(plan.salaireFixe)} · Revenu estimé {fmtHTG(plan.revenuEstime.total)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <PlanContent plan={plan} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
