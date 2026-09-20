// Fixed curriculum templates, one ordered list of session topics per
// formation (exact title strings from the PDFs Panacée provided). Applying a
// template to a course zips this list, in order, against the course's actual
// weekend dates (see weekendDatesBetween in pedagogie.js) — so it only works
// once a course has both end_date and course_end_date set.
export const PROGRAM_TEMPLATES = {
  'Installation de caméra de surveillance': [
    { title: "Semaine 1, Samedi — Introduction à la vidéosurveillance : types de caméras (dôme, bullet, PTZ, fisheye, cube, espion), tableau comparatif des usages, aperçu général analogique vs IP" },
    { title: "Semaine 1, Dimanche — Rôle du NVR/DVR, PoE, switch réseau (manageable / non manageable), cadre juridique de la vie privée applicable à la vidéosurveillance (DUDH art. 12, PIDCP art. 17, RGPD, lois nationales du pays d'installation)" },
    { title: "Semaine 2, Samedi — Installation de caméras : outils vs matériel, outils nécessaires (perceuse, niveau à bulle, pince à sertir...), matériels de câblage et de fixation, matériels réseau et alimentation" },
    { title: "Semaine 2, Dimanche — Le multimètre : tension, courant, résistance, continuité ; équipement de sécurité ; le devis professionnel : estimatif / quantitatif / descriptif, structure d'un devis" },
    { title: "Semaine 3, Samedi — Atelier pratique 1 : le câble réseau Ethernet, normes T568A/T568B, sertissage d'un connecteur RJ45 et test au testeur de câble" },
    { title: "Semaine 3, Dimanche — Atelier pratique 2 : installation du système analogique (montage caméra, raccordement coaxial, connexion au DVR)" },
    { title: "Semaine 4, Samedi — Pratique terrain (jour 1) : étude de cas puis installation IP complète sur site réel (câblage Cat6, pose et raccordement de caméras IP, configuration NVR)" },
    { title: "Semaine 4, Dimanche — Pratique terrain (jour 2, si nécessaire selon le nombre d'élèves) ou journée de révision et préparation à l'évaluation" },
    { title: "Semaine 5, Samedi — Évaluation finale : rédaction du devis réel pour le site travaillé, évaluation pratique récapitulative" }
  ],
  'Électricité': [
    { title: "Semaine 1, Samedi — Introduction à l'électricité - Résistance Électrique" },
    { title: "Semaine 1, Dimanche — Testeur Électrique - Pratique" },
    { title: "Semaine 2, Samedi — Tension Électrique - Puissance Électrique" },
    { title: "Semaine 2, Dimanche — Jonction Électrique - Pratique" },
    { title: "Semaine 3, Samedi — Ampérage Électrique - Étude des outils et des dispositifs électriques" },
    { title: "Semaine 3, Dimanche — Pratique" },
    { title: "Semaine 4, Samedi — Révision - Pratique" },
    { title: "Semaine 4, Dimanche — Test d'évaluation" },
    { title: "Semaine 5, Samedi — Allumage direct - Pratique" },
    { title: "Semaine 5, Dimanche — Allumage en série et parallèles - Pratique" },
    { title: "Semaine 6, Samedi — Couplage des batteries - Étude" },
    { title: "Semaine 6, Dimanche — Couplage des batteries (Révision - Devoir à la maison)" },
    { title: "Semaine 7, Samedi — Système panneaux solaires photovoltaïques" },
    { title: "Semaine 7, Dimanche — Système panneaux solaires photovoltaïques" },
    { title: "Semaine 8, Samedi — Allumage avec interrupteur three way et four way - Schéma - Pratique" },
    { title: "Semaine 8, Dimanche — Évaluation" },
    { title: "Semaine 9, Samedi — Allumage avec interrupteur simple - Schéma - Pratique" },
    { title: "Semaine 9, Dimanche — Symboles électriques et Mathématiques" },
    { title: "Semaine 10, Samedi — Révision - Pratique" },
    { title: "Semaine 10, Dimanche — Allumage avec interrupteurs double et three way" },
    { title: "Semaine 11, Samedi — Montage en cave - Schéma - Pratique" },
    { title: "Semaine 11, Dimanche — Montage chambre d'hôpital - Schéma - Pratique" },
    { title: "Semaine 12, Samedi — Test d'évaluation" },
    { title: "Semaine 12, Dimanche — Résultat - Pratique" }
  ]
};
