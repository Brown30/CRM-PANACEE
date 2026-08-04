import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { PhoneCall, HelpCircle } from 'lucide-react';
import { salesMethodologies, commonObjections } from '@/data/salesMethodologies';

function Section({ section, vendorName }) {
  const body = section.body?.replace('{vendorName}', vendorName);
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {section.heading}
      </h4>
      {body && <p className="text-sm text-slate-600 whitespace-pre-line">{body}</p>}
      {section.list && (
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          {section.list.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {section.footer && <p className="text-sm text-slate-600 whitespace-pre-line">{section.footer}</p>}
    </div>
  );
}

export default function MethodologyPage() {
  const { user } = useAuth();
  const vendorName = user?.name || '';

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="methodology-page">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <PhoneCall className="w-5 h-5 text-emerald-500" /> Méthodologie de Vente
      </h2>

      {salesMethodologies.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <PhoneCall className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">Aucune méthodologie disponible pour le moment</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5">
        <Accordion type="single" collapsible>
          {salesMethodologies.map((m) => (
            <AccordionItem key={m.formation} value={m.formation} data-testid={`methodology-${m.formation}`}>
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-slate-800 text-sm">{m.title}</p>
                  <p className="text-xs text-slate-400">{m.formation}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {m.sections.map((section, i) => (
                    <Section key={i} section={section} vendorName={vendorName} />
                  ))}

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      <HelpCircle className="w-4 h-4 text-emerald-500" /> Objections & Réponses
                    </h4>
                    {commonObjections.length === 0 && m.objections.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucune objection enregistrée pour le moment</p>
                    ) : (
                      <div className="space-y-3">
                        {[...commonObjections, ...m.objections].map((o, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-3">
                            <p className="text-sm font-medium text-slate-800">{o.question}</p>
                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{o.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
