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

export const salesMethodologies = [
  {
    formation: 'Électricité',
    title: 'Elektrisite',
    sections: [
      {
        heading: '1- SALITASYON',
        body: 'Bonjou, mwen se {vendorName}, mwen se Responsab nan Panacée Éducation'
      },
      {
        heading: '2- PREMYE PWOMÈS',
        body: "Ou très interessé pouw aprann Elektrisite e ou te voye mesaj sou WhatsApp nou, èske ou disponib pou kèk minit pou mwen baw plis detay avan ou enskri?"
      },
      {
        heading: '3- KONEKSYON',
        list: [
          'Kijanw rele svp ?',
          'Ou rete Okap oubyen nan rejyon nò a?',
          'Poukisa ou deside aprann Elektrisite ?',
          'Ou gen eksperyans nan domèn sa deja oubyen se premye fwa ou pral fè eksperyans lan?',
          'Ou pwofesyonèl nan lòt domèn deja ?'
        ]
      },
      {
        heading: '4- PREZANTASYON',
        body: "Avan nou pale de pri kou an, mwen pral baw plis enfòmasyon sou Panacée Éducation e sou fòmasyon an tou\n\nÈske w'ap tandem byen ??",
        list: [
          'Nou gen plis pase 200 Etidyan ki aprann avèk nou deja nan Panacée (Anpil nan yo potko gen okenn eksperyans nan domèn nan) (Anpil nan yo te gen yon nivo deja nan domèn nan)',
          'Pwofesè ki pral fòmew lan se yon Tekniksyen ki gen plis ke 20 ans eksperyans nan domèn nan e ki fè pwojè nan tout peyi an sou anpil gwo chantye.',
          "W'ap gen nosyon ni nan Elektrisite batiman ni nan Elektrisite endistriyèl",
          'Ou pap fè sèlman teyori, ap gen pratik kap fèt nan salle de classe lan menm e ap gen pratik sou chantye tou',
          "Lèw rantre nan Panacée, ou pa jis rantre nan yon senp lekòl pwofesyonèl men otomatikman ou fè pati kominote nou an e ou montre ou très motive pouw aprann, ou ka vin yonn nan pwofesyonèl nan Panacée Services ki se yon lòt antrepriz nou genyen ki konn jwenn chantye Elektrisite. Anpil fwa nou konn gen chantye nou bezwen bon jan pwofesyonèl ki konpetan pou yo e anpil fwa se etidyan ki te nan Panacée, nap rele pou travay sa yo."
        ],
        footer: "Èske jiskaprezan ou klè sou tout pwen yo ?\n\n- Yonn nan pi gwo avantaj wap gen lèw fin etidye nan Panacée, wap sòti ak 2 sètifika e dezyèm sètifika a ap gratis. Gen yon lòt kou bonus ke nap fè anliy pou ou. Nan kou sa, ou pral aprann strateji ou ka mete anplas pouw ka gen plis kliyan ki bezwen sèvis Elektrisite.\n- Fòmasyon Elektrisite Avanse a ap kòmanse Samdi 22 Août sa\nL'ap dire 3 mwa\nKou yo ap fèt Samdi, Dimanch e lè an se 4h-6h nan aprèmidi.\n\nÈske tout bagay klè oubyen ou gen kesyon ?"
      },
      {
        heading: '5- CLOSING VIBE',
        body: "Ofisyèlman, frè enskripsyon an se 1000 Goud e frè patisipasyon an se 25.000 Goud.\nTout bagay klè pou ou sou kesyon pri an ?\n\nNan Panacée, nou gen yon pwogram ki rele PFP, ki vle di \"Programme de Financement pour les Professionnels\"\n\nObjèktif Finansman sa, se pèmèt moun ki pwofesyonèl deja e ki montre anpil enterè pou Fòmasyon sa peye mwens kòb, paske moun sa yo anpil fwa, aprann pi rapid e vin pi gwo pwofesyonèl, pou sa nou konsidere moun sa yo. Ou te dim nan kòmansman apèl lan ou se pwofesyonèl …….. Pa vre ?\n\nSi moun nan te diw li pa pwofesyonèl nan anyen:\nObjèktif Finansman sa, se pèmèt moun ki vle aprann yon domèn pwofesyonèl pou premye fwa peye mwens kòb, sa fasilite yo rantre nan sektè pwofesyonèl lan pi rapid.\nSiw rive patisipe nan pwogram sa, olye de peye 25.000 Goud nan fòmasyon Elektrisite Avanse a, w'ap peye sèlman 20.000 Goud akoz de Pwogram nan.\n\nOu ta renmen benefisye pwogram sa ?\nEbyen Pouw ka fè pati de pwogram nan, enskripsyon ou sipoze konfime jiska demen aprèmidi\nKonsa n'ap idantifyew pami moun ki trè Enterese yo e metew nan lis moun ki benefisyè pwogram nan\n\nFrè Enskripsyon an pou pran avantaj lan se sèlman 1.000 Goud.\n\nBanm non konplèw poum metew nan lis moun k'ap benefisye rabè 5.000 Goud sa.\n\nE imedyatman ou enskri jiska demen, ou ka jwenn lòt sipriz ou pa menm imajine lèw vini nan fòmasyon an.\nOu ka pase enskri nan Lokal administratif nou nan #12, Rue 22 B-C, nap baw fich ki gen so nou nòmalman.\n\nSi ou santi moun nan pap ka deplase oubyen li diw sa:\nsiw pa ka deplase tou, ou ka peye pa Moncash/Natcash, nap voye foto fich lan ak tout so pou ou nòmalman aprè Enskripsyon."
      }
    ],
    objections: [
      // { question: '...', answer: '...' } - à compléter au fur et à mesure
    ]
  }
];

export const getMethodology = (formation) =>
  salesMethodologies.find(m => m.formation === formation);
