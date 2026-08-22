// Objections communes à toutes les formations - affichées sur chaque page de méthodologie
export const commonObjections = [
  {
    question: 'Mwen p ap gen tan Samdi oubyen Dimanch.',
    answer: `Mwen ka konprann ou pa gen tan nan jou sa, anpil moun k'ap vini nan fòmasyon an se kreye yo kreye tan pou yo ka patisipe.
Paske yo reyèlman vle aprann domèn sa yo konnen k'ap itil yo.
Anplis se sèlman 2h de temps nan jou Samdi/Dimanch sa pandan 1 mwa sèlman.

Èske ou panse w'ap ka kreye tan pouw ka patisipe oubyen sa pap posib ditou ?`
  }
];

// The per-formation methodologies (sections + objections) used to live here as a static
// array, but are now stored in Supabase (table `sales_methodologies`) and edited directly
// from the Méthodologie page in the app. See MethodologyPage.js.
