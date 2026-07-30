export const performancePlans = [
  {
    name: 'Jamesley',
    periode: 'Du 03 août 2026 au 22 août 2026',
    formationPrincipale: 'Électricité',
    missionSecondaire: null,
    salaireFixe: 15000,
    objectifs: [
      {
        titre: 'Formation : Électricité',
        periode: 'Du 03 août 2026 au 22 août 2026',
        planAppels: [
          'Du lundi au vendredi : 20 appels par jour',
          'Le samedi : 10 appels',
          'Le dimanche : Aucun appel',
        ],
        calculDetaille: [
          '15 jours (lundi au vendredi) × 20 appels = 300 appels',
          '3 samedis × 10 appels = 30 appels',
        ],
        totalAppels: 330,
        objectifMinInscriptions: 20,
        tauxConversionMin: '6,06 %',
        conversionNote: "environ 6 personnes sur 100 contactées devront s'inscrire.",
        projectionExcellente: { taux: '12 %', inscriptions: 40 },
        commission: {
          inscription: { qte: 20, unitaire: 150, total: 3000 },
          participation: { tauxParticipation: '75 %', participants: 15, unitaire: 750, total: 11250 },
          total: 14250,
        },
      },
    ],
    revenuEstime: { lignes: [['Salaire fixe', 15000], ['Commission estimée', 14250]], total: 29250 },
    recap: [
      ['Salaire fixe', '15 000 HTG'],
      ['Total des appels', '330'],
      ['Objectif', '20 inscriptions'],
      ['Conversion minimale', '6,06 %'],
      ['Projection à 12 %', '40 inscriptions'],
      ['Commission estimée', '14 250 HTG'],
      ['Revenu total estimé', '29 250 HTG'],
    ],
    motFinal: `Chaque appel représente une opportunité.

Votre discipline, votre constance et votre professionnalisme feront la différence.

Les objectifs fixés sont réalistes et atteignables.`,
  },
  {
    name: 'Edjivenson',
    periode: 'Du 03 août 2026 au 22 août 2026',
    formationPrincipale: 'Électricité',
    missionSecondaire: null,
    salaireFixe: 15000,
    objectifs: [
      {
        titre: 'Formation : Électricité',
        periode: 'Du 03 août 2026 au 22 août 2026',
        planAppels: [
          'Du lundi au vendredi : 20 appels par jour',
          'Le samedi : 10 appels',
          'Le dimanche : Aucun appel',
        ],
        calculDetaille: [
          '15 jours (lundi au vendredi) × 20 appels = 300 appels',
          '3 samedis × 10 appels = 30 appels',
        ],
        totalAppels: 330,
        objectifMinInscriptions: 20,
        tauxConversionMin: '6,06 %',
        conversionNote: "environ 6 personnes sur 100 contactées devront s'inscrire.",
        projectionExcellente: { taux: '12 %', inscriptions: 40 },
        commission: {
          inscription: { qte: 20, unitaire: 150, total: 3000 },
          participation: { tauxParticipation: '75 %', participants: 15, unitaire: 750, total: 11250 },
          total: 14250,
        },
      },
    ],
    revenuEstime: { lignes: [['Salaire fixe', 15000], ['Commission estimée', 14250]], total: 29250 },
    recap: [
      ['Salaire fixe', '15 000 HTG'],
      ['Total des appels', '330'],
      ['Objectif', '20 inscriptions'],
      ['Conversion minimale', '6,06 %'],
      ['Projection à 12 %', '40 inscriptions'],
      ['Commission estimée', '14 250 HTG'],
      ['Revenu total estimé', '29 250 HTG'],
    ],
    motFinal: `Chaque appel représente une opportunité.

Votre discipline, votre constance et votre professionnalisme feront la différence.

Les objectifs fixés sont réalistes et atteignables.`,
  },
  {
    name: 'Laguerre',
    periode: 'Du 30 juillet 2026 au 22 août 2026',
    formationPrincipale: 'Installation de Caméras de Surveillance',
    missionSecondaire: "Soutien à la Formation d'Électricité",
    salaireFixe: 15000,
    objectifs: [
      {
        titre: 'Formation : Installation de Caméras de Surveillance',
        periode: 'Du 30 juillet 2026 au 22 août 2026',
        planAppels: [
          'Du lundi au vendredi : 15 appels par jour',
          'Le samedi : 8 appels',
          'Le dimanche : Aucun appel',
        ],
        calculDetaille: [
          '16 jours (lundi au vendredi) × 15 appels = 240 appels',
          '5 samedis × 8 appels = 40 appels',
        ],
        totalAppels: 280,
        objectifMinInscriptions: 25,
        tauxConversionMin: '8,93 %',
        conversionNote: "environ 9 personnes sur 100 contactées devront s'inscrire.",
        projectionExcellente: { taux: '12 %', inscriptions: 34 },
        commission: {
          inscription: { qte: 25, unitaire: 150, total: 3750 },
          participation: { tauxParticipation: '75 %', participants: 18, unitaire: 500, total: 9000 },
          total: 12750,
        },
      },
      {
        titre: "Soutien à la Formation d'Électricité",
        periode: 'Du 30 juillet 2026 au 22 août 2026',
        planAppels: [
          'Du lundi au vendredi : 5 appels par jour',
          'Le samedi : Aucun appel',
          'Le dimanche : Aucun appel',
        ],
        calculDetaille: [
          'Jeudi 30 juillet : 5 appels',
          'Vendredi 31 juillet : 5 appels',
          '15 jours (lundi au vendredi) × 5 appels = 75 appels',
        ],
        totalAppels: 85,
        objectifMinInscriptions: 5,
        tauxConversionMin: '5,88 %',
        conversionNote: "environ 6 personnes sur 100 contactées devront s'inscrire.",
        projectionExcellente: { taux: '12 %', inscriptions: 10 },
        commission: {
          inscription: { qte: 5, unitaire: 150, total: 750 },
          participation: { tauxParticipation: null, participants: 3, unitaire: 750, total: 2250 },
          total: 3000,
        },
      },
    ],
    revenuEstime: {
      lignes: [['Salaire fixe', 15000], ['Commission estimée (Caméras)', 12750], ['Commission estimée (Électricité)', 3000]],
      total: 30750,
    },
    recap: [
      ['Salaire fixe', '15 000 HTG'],
      ['Total des appels (Caméras)', '280'],
      ['Total des appels (Électricité)', '85'],
      ['Total général des appels', '365'],
      ['Objectif Caméras', '25 inscriptions'],
      ['Objectif Électricité', '5 inscriptions'],
      ['Objectif total', '30 inscriptions'],
      ['Conversion minimale Caméras', '8,93 %'],
      ['Conversion minimale Électricité', '5,88 %'],
      ['Commission estimée', '15 750 HTG'],
      ['Revenu total estimé', '30 750 HTG'],
    ],
    motFinal: `Chaque appel représente une opportunité.

Votre discipline, votre constance et votre professionnalisme feront la différence.

Les objectifs fixés sont réalistes et atteignables.`,
  },
  {
    name: 'Maëva',
    periode: 'Du 30 juillet 2026 au 22 août 2026',
    formationPrincipale: 'Installation de Caméras de Surveillance',
    missionSecondaire: "Soutien à la Formation d'Électricité",
    salaireFixe: 22000,
    objectifs: [
      {
        titre: 'Formation : Installation de Caméras de Surveillance',
        periode: 'Du 30 juillet 2026 au 22 août 2026',
        planAppels: [
          'Du lundi au vendredi : 15 appels par jour',
          'Le samedi : 8 appels',
          'Le dimanche : Aucun appel',
        ],
        calculDetaille: [
          '16 jours (lundi à vendredi) × 15 appels = 240 appels',
          '5 samedis × 8 appels = 40 appels',
        ],
        totalAppels: 280,
        objectifMinInscriptions: 20,
        tauxConversionMin: '7,14 %',
        conversionNote: "environ 7 personnes sur 100 contactées devront s'inscrire.",
        projectionExcellente: { taux: '12 %', inscriptions: 34 },
        commission: {
          inscription: { qte: 20, unitaire: 150, total: 3000 },
          participation: { tauxParticipation: '75 %', participants: 15, unitaire: 500, total: 7500 },
          total: 10500,
        },
      },
      {
        titre: "Soutien à la Formation d'Électricité",
        periode: 'Du 30 juillet 2026 au 22 août 2026',
        planAppels: [
          'Du lundi au vendredi : 5 appels par jour',
          'Le samedi : Aucun appel',
          'Le dimanche : Aucun appel',
        ],
        calculDetaille: [
          'Jeudi 30 juillet : 5 appels',
          'Vendredi 31 juillet : 5 appels',
          '15 jours (lundi à vendredi) × 5 appels = 75 appels',
        ],
        totalAppels: 85,
        objectifMinInscriptions: 7,
        tauxConversionMin: '8,24 %',
        conversionNote: "environ 8 personnes sur 100 contactées devront s'inscrire.",
        projectionExcellente: { taux: '12 %', inscriptions: 10 },
        commission: {
          inscription: { qte: 7, unitaire: 150, total: 1050 },
          participation: { tauxParticipation: null, participants: 5, unitaire: 750, total: 3750 },
          total: 4800,
        },
      },
    ],
    revenuEstime: {
      lignes: [['Salaire fixe', 22000], ['Commission estimée (Caméras)', 10500], ['Commission estimée (Électricité)', 4800]],
      total: 37300,
    },
    recap: [
      ['Salaire fixe', '22 000 HTG'],
      ['Total des appels (Caméras)', '280'],
      ['Total des appels (Électricité)', '85'],
      ['Total général des appels', '365'],
      ['Objectif Caméras', '20 inscriptions'],
      ['Objectif Électricité', '7 inscriptions'],
      ['Objectif total', '27 inscriptions'],
      ['Conversion minimale Caméras', '7,14 %'],
      ['Conversion minimale Électricité', '8,24 %'],
      ['Commission estimée', '15 300 HTG'],
      ['Revenu total estimé', '37 300 HTG'],
    ],
    motFinal: `Votre objectif est parfaitement atteignable.

En maintenant une activité commerciale régulière, en assurant un bon suivi des prospects et en développant une communication de qualité, vous avez toutes les chances d'atteindre, voire de dépasser vos objectifs.

Chaque appel est une opportunité.

Chaque prospect mérite un suivi sérieux.

Votre engagement quotidien fera la différence.

Le succès de cette campagne dépend de votre discipline, de votre constance et de votre détermination.`,
  },
];

export const getPlanByName = (name) =>
  performancePlans.find(p => p.name.toLowerCase() === (name || '').toLowerCase());
