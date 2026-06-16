// Programmatic Content Engine - Gironde (33) - Borne de Recharge
// Generates highly unique, localized, helpful content for each commune in the Gironde department.
// Uses a multi-dimensional sentence-level spintax matrix to avoid duplicate content penalties
// and provides rich technical details (E-E-A-T) optimized for local search queries in 33.

import { getNearbyCommunes } from './geoLinks';
import communes from '../data/communes.json';

export function spin(text: string, seed: string): string {
  let result = text;
  const spintaxTest = /{([^{}|]+\|[^{}]+)}/;
  const spintaxReplace = /{([^{}|]+\|[^{}]+)}/g;
  
  while (spintaxTest.test(result)) {
    result = result.replace(spintaxReplace, (match, choicesStr) => {
      if (['VILLE', 'CODE_POSTAL', 'PRIX_MIN', 'PRIX_MAX', 'VARIANTE_INTRO'].includes(choicesStr)) {
        return match;
      }
      const choices = choicesStr.split('|');
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
      }
      hash = hash + choicesStr.length;
      const index = Math.abs(hash) % choices.length;
      return choices[index];
    });
  }
  return result;
}

export interface Commune {
  nom: string;
  slug: string;
  codeInsee: string;
  codePostal: string;
  population: number;
  altitude?: number;
  prixM2Moyen?: number;
  logements?: number;
  logementsMaison?: number;
  vehiculesElectriques?: number;
  croissanceVE?: number;
  bornesPubliques?: number;
  intercommunalite?: string;
  canton?: string;
  latitude?: number;
  longitude?: number;
  distanceBordeaux?: number;
  densiteBornes?: number;
  profilCommune?: string;
  marcheImmobilier?: string;
  tauxMaisonLabel?: string;
}

export interface ExternalLink {
  label: string;
  url: string;
  description: string;
}

export interface GuideLink {
  href: string;
  label: string;
  desc: string;
}

export interface LocalContent {
  introParagraph: string;
  logisticsAlert: string;
  useCaseText: string;
  pricesContext: string;
  faqItems: { question: string; answer: string }[];
  ecoText: string;
  localContext: string;
  climateZoneLabel: string;
  localAgencyName: string;
  externalLinks: ExternalLink[];
  communeDataInsight: string;
  expertTip: string;
  tableIntro: string;
  guideLinks: GuideLink[];
  savingsEstimate: string;
  lastUpdated: string;
  realEstateInsight: string;
  populationTierContent: string;
  densiteAnalysis: string;
  marcheImmobilierInsight: string;
  distanceLyonContext: string; // compatibility with layouts
  localRegulation: string;
  sourcesCitation: string;
}

export type ClimateZone = 'bordeaux-metropole' | 'bassin-arcachon' | 'libournais-medoc';

const CATEGORY_OFFSETS: Record<string, number> = {
  main: 0,
  copropriete: 100,
  wallbox: 200
};

export function getClimateZone(codePostal: string, slug: string): ClimateZone {
  const cp = codePostal.trim();
  
  const metroSlugs = new Set([
    'bordeaux', 'merignac', 'pessac', 'talence', 'villenave-d-ornon', 'saint-medard-en-jalles',
    'begles', 'gradignan', 'cenon', 'lormont', 'eysines', 'bruges', 'le-bouscat', 'floirac'
  ]);
  
  if (metroSlugs.has(slug) || cp.startsWith('330') || cp.startsWith('33100') || cp.startsWith('33200') || cp.startsWith('33700') || cp.startsWith('33600') || cp.startsWith('33400') || cp.startsWith('33130') || cp.startsWith('33140')) {
    return 'bordeaux-metropole';
  }
  
  if (cp.startsWith('33120') || cp.startsWith('33260') || cp.startsWith('33470') || cp.startsWith('33510') || cp.startsWith('33950') || slug.includes('arcachon') || slug.includes('ferret')) {
    return 'bassin-arcachon';
  }
  
  return 'libournais-medoc';
}

export function getLocalAgency(codePostal: string, slug: string): { name: string; detail: string; website: string } {
  const zone = getClimateZone(codePostal, slug);
  if (zone === 'bordeaux-metropole') {
    return {
      name: "l'ALEC de la Métropole de Bordeaux (Agence Locale de l'Énergie et du Climat)",
      detail: "le guichet d'information pour la transition et l'éco-habitat de la métropole",
      website: "alec-mb33.fr"
    };
  }
  return {
    name: "l'Espace Conseil France Rénov' de Gironde (animé par le CREAQ)",
    detail: "le conseiller info-énergie officiel du département de la Gironde",
    website: "creaq.org"
  };
}

export function getVariantIndex(slug: string, offset: number, maxVariants: number): number {
  // FNV-1a inspired hash with proper offset mixing
  let hash = 2166136261; // FNV offset basis
  hash = Math.imul(hash ^ offset, 16777619);
  hash = Math.imul(hash ^ (offset >>> 16), 2654435761);
  for (let i = 0; i < slug.length; i++) {
    hash = Math.imul(hash ^ slug.charCodeAt(i), 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  return (hash >>> 0) % maxVariants;
}

export function getDynamicPrices(commune: Commune) {
  // Continuous price factor based on multiple local data points for truly unique pricing
  let priceFactor = 1.0;
  
  // Population-based adjustment (continuous, not tiered)
  if (commune.population > 200000) priceFactor += 0.06;
  else if (commune.population > 50000) priceFactor += 0.03 + (commune.population - 50000) / 500000;
  else if (commune.population > 20000) priceFactor += 0.01 + (commune.population - 20000) / 300000;
  else if (commune.population > 5000) priceFactor -= 0.01;
  else priceFactor -= 0.03;
  
  // Real estate premium adjustment (proxy for local cost of living)
  if (commune.prixM2Moyen) {
    if (commune.prixM2Moyen > 5000) priceFactor += 0.04;
    else if (commune.prixM2Moyen > 4000) priceFactor += 0.02;
    else if (commune.prixM2Moyen > 3000) priceFactor += 0.01;
    else if (commune.prixM2Moyen < 2000) priceFactor -= 0.02;
  }
  
  // Distance-based adjustment (farther = slightly cheaper labor)
  if (commune.distanceBordeaux && commune.distanceBordeaux > 50) priceFactor -= 0.01;
  if (commune.distanceBordeaux && commune.distanceBordeaux > 80) priceFactor -= 0.01;
  
  // Premium communes
  if (['lege-cap-ferret', 'arcachon', 'le-bouscat', 'bordeaux'].includes(commune.slug)) priceFactor += 0.03;
  
  // Clamp factor to reasonable range
  priceFactor = Math.max(0.93, Math.min(1.12, priceFactor));

  return {
    greenUp: { min: Math.round(400 * priceFactor), max: Math.round(700 * priceFactor) },
    wallbox7kW: { min: Math.round(1200 * priceFactor), max: Math.round(1800 * priceFactor) },
    wallbox11kW: { min: Math.round(1500 * priceFactor), max: Math.round(2300 * priceFactor) },
    wallbox22kW: { min: Math.round(2100 * priceFactor), max: Math.round(3600 * priceFactor) },
    copro: { min: Math.round(2600 * priceFactor), max: Math.round(4800 * priceFactor) },
    triUpgrade: { min: Math.round(500 * priceFactor), max: Math.round(1200 * priceFactor) },
    priceFactor
  };
}

function getExternalLinks(category: string, codePostal: string, slug: string): ExternalLink[] {
  const agency = getLocalAgency(codePostal, slug);
  const agencyUrl = agency.website.startsWith('http') ? agency.website : `https://www.${agency.website}`;
  
  const base: ExternalLink[] = [
    {
      label: "Programme ADVENIR — Subventions Bornes de Recharge",
      url: "https://advenir.mobi",
      description: "Site officiel du programme ADVENIR détaillant les primes pour les particuliers, les syndics et les entreprises."
    },
    {
      label: `${agency.name} — Service Public local`,
      url: agencyUrl,
      description: "Accompagnement de proximité gratuit pour votre transition énergétique et aides financières en Gironde."
    },
    {
      label: "Annuaire des Électriciens qualifiés IRVE",
      url: "https://www.qualifelec.fr",
      description: "Vérifiez la qualification IRVE (Infrastructure de Recharge pour Véhicules Électriques) de votre électricien."
    }
  ];

  if (category === 'copropriete') {
    return [
      ...base,
      {
        label: "Légifrance — Décret n° 2020-1720 (Droit à la prise)",
        url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042740927",
        description: "Texte de loi officiel régissant le droit à la prise pour la recharge des véhicules électriques en copropriété."
      }
    ];
  } else if (category === 'wallbox') {
    return [
      ...base,
      {
        label: "Automobile Propre — Guide de la recharge à domicile",
        url: "https://www.automobile-propre.com",
        description: "Comparatifs indépendants, temps de charge et explications détaillées sur le fonctionnement des wallbox."
      }
    ];
  } else {
    return [
      ...base,
      {
        label: "Service-Public.fr — Crédit d'impôt Borne de recharge",
        url: "https://www.service-public.fr/particuliers/vosdroits/F35535",
        description: "Fiche officielle décrivant les conditions pour bénéficier du crédit d'impôt de 500 € en 2026."
      }
    ];
  }
}

function getGuideLinks(category: string, slug: string = ''): GuideLink[] {
  const allGuides: GuideLink[] = [
    { href: '/guides/copropriete-bordeaux-infrastructure-irve/', label: 'Copropriété à Bordeaux : Infrastructure IRVE', desc: 'Comment fonctionne le raccordement IRVE en copropriété bordelaise.' },
    { href: '/guides/aide-advenir-gironde-2026/', label: 'Aides ADVENIR Gironde 2026', desc: "Cumuler ADVENIR, crédit d'impôt et subventions départementales." },
    { href: '/guides/prix-borne-recharge-gironde-2026/', label: 'Prix Borne Recharge Gironde 2026', desc: 'Budget complet pour équiper votre logement dans le 33.' },
    { href: '/guides/comparatif-wallbox-maison-individuelle/', label: 'Comparatif Wallbox 2026', desc: 'Les 5 meilleures wallbox pour maison individuelle en Gironde.' },
    { href: '/guides/wallbox-panneaux-solaires-gironde/', label: 'Solaire & Wallbox en Gironde', desc: 'Rentabilité et autoconsommation sous le soleil du Sud-Ouest.' },
    { href: '/guides/zfe-bordeaux-crit-air-borne-recharge/', label: 'ZFE Bordeaux & Recharge', desc: 'Calendrier Crit\'Air et intérêt d\'équiper son garage.' },
    { href: '/guides/echoppe-bordelaise-wallbox-contraintes-abf/', label: 'Échoppe Bordelaise & Wallbox', desc: 'Contraintes ABF, passage de câble et solutions discrètes.' },
    { href: '/guides/voiture-electrique-gironde-autonomie-bornes/', label: 'Autonomie VE en Gironde', desc: 'Distances, bornes publiques et gestion de l\'autonomie dans le 33.' },
  ];

  // Priority guides per category (shown first if selected)
  const categoryPriority: Record<string, number[]> = {
    copropriete: [0, 1, 2],
    wallbox: [3, 4, 5],
    main: [2, 6, 5],
  };

  // Select 3 guides with rotation based on slug
  const prioritySet = new Set(categoryPriority[category] || [2, 6, 5]);
  const baseOffset = getVariantIndex(slug, 300, allGuides.length);
  
  const selected: GuideLink[] = [];
  const usedIndices = new Set<number>();
  
  // Always include 1 priority guide
  const priorityArr = Array.from(prioritySet);
  const priorityIdx = priorityArr[getVariantIndex(slug, 310, priorityArr.length)];
  selected.push(allGuides[priorityIdx]);
  usedIndices.add(priorityIdx);
  
  // Fill remaining 2 spots from rotation
  let rotOffset = baseOffset;
  while (selected.length < 3) {
    const idx = rotOffset % allGuides.length;
    if (!usedIndices.has(idx)) {
      selected.push(allGuides[idx]);
      usedIndices.add(idx);
    }
    rotOffset++;
  }
  
  return selected;
}

// Spintax pools definition (Elegant, Bordeaux-tech tone)
const INTRO_POOLS: Record<string, string[]> = {
  main: [
    "Pour {l'installation|la pose} de votre borne de recharge à {VILLE}, {profitez|bénéficiez} d'une pose clés en main par nos techniciens certifiés IRVE. Nous réalisons une étude de conformité de votre tableau électrique pour garantir une charge {sûre|sécurisée} avec délestage dynamique Linky.",
    "Besoin d'installer une borne pour votre véhicule électrique à {VILLE} ? Nos installateurs locaux de Gironde vous accompagnent dans le choix d'une wallbox {adaptée|performante} de type P1/P2 et gèrent vos démarches d'aides financières ADVENIR.",
    "Sécurisez la charge de votre véhicule électrique à {VILLE} grâce à une wallbox {7.4 kW|11 kW} installée par un électricien IRVE agréé. Devis gratuit et visite technique sous {48h|deux jours} dans tout le 33.",
    "Avec le développement de la ZFE de Bordeaux Métropole en Gironde, équiper sa maison de {VILLE} d'une borne de recharge rapide à domicile est la solution {idéale|optimale} pour charger à moindre coût et anticiper les interdictions.",
    "Vous habitez à {VILLE} et souhaitez passer à la vitesse supérieure pour votre voiture électrique ? Nos électriciens partenaires certifiés Qualifelec IRVE installent votre borne de recharge {à domicile|chez vous} en conformité avec la norme NF C 15-100.",
    "Recharger sa voiture sur une prise domestique standard à {VILLE} est {trop lent|inefficace} et risqué. Optez pour une installation de borne murale intelligente avec Smart Charging et protocole ISO 15118.",
    "Nos experts en solutions de recharge interviennent à {VILLE} pour dimensionner et poser votre wallbox. Bénéficiez des aides de l'État (TVA à 5,5% et crédit d'impôt de 500 €) avec nos {pros|artisans certifiés IRVE}.",
    "Profitez de l'expertise d'un installateur IRVE à {VILLE} pour raccorder votre wallbox intelligente. Nous configurons le délestage dynamique pour protéger l'installation électrique de votre {maison|logement} lors des pics de consommation."
  ],
  copropriete: [
    "Vous habitez en copropriété à {VILLE} et souhaitez installer une borne de recharge ? Le droit à la prise vous garantit la possibilité d'équiper votre place de parking à vos frais, avec le soutien des aides ADVENIR en Gironde.",
    "Installez votre borne de recharge en copropriété à {VILLE} en toute simplicité. Nos techniciens certifiés IRVE vous aident à formaliser votre demande auprès du syndic girondin et à obtenir jusqu'à 960 € de subvention ADVENIR.",
    "Le droit à la prise (décret 2020) permet à tout locataire ou propriétaire d'un appartement à {VILLE} d'installer un point de recharge sur son emplacement de stationnement. Découvrez nos infrastructures collectives certifiées.",
    "Sécurisez la recharge de votre voiture électrique dans votre résidence à {VILLE}. Nous concevons des installations individuelles ou collectives conformes aux exigences IRVE et éligibles aux primes ADVENIR 2026.",
    "Rendre votre copropriété à {VILLE} compatible avec la recharge électrique valorise l'ensemble des appartements. Nos experts IRVE interviennent pour installer des bornes individuelles raccordées au TGBT des parties communes.",
    "Le raccordement d'une borne en parking partagé ou sous-sol à {VILLE} requiert une expertise spécifique. Nous réalisons l'étude technique nécessaire pour présenter un dossier solide à votre syndic de copropriété.",
    "Faites installer votre wallbox dans votre résidence de {VILLE} en bénéficiant de la prime ADVENIR copropriété qui finance jusqu'à 50% du projet d'installation électrique individuelle.",
    "Nos électriciens certifiés IRVE en Gironde accompagnent les syndics et les copropriétaires de {VILLE} de l'étude de faisabilité technique jusqu'à la mise en service finale de la borne."
  ],
  wallbox: [
    "Optimisez la recharge de votre voiture électrique à {VILLE} en faisant installer une borne murale rapide (Wallbox) de 7.4 kW à 22 kW par nos électriciens certifiés IRVE de Gironde.",
    "Besoin d'une recharge rapide et intelligente à domicile à {VILLE} ? Découvrez nos modèles de Wallbox connectées avec gestion des heures creuses et délestage de puissance en temps réel.",
    "Installez une borne de recharge performante (Wallbox) dans votre maison à {VILLE}. Nous sélectionnons les meilleures marques du marché pour vous garantir une charge sécurisée, rapide et compatible protocole ISO 15118.",
    "La Wallbox est la solution de recharge résidentielle par excellence à {VILLE}. Elle permet de recharger votre véhicule électrique jusqu'à 8 fois plus vite qu'une prise de courant standard.",
    "Faites poser votre borne Wallbox à {VILLE} par un électricien agréé IRVE pour sécuriser votre installation électrique et bénéficier des aides financières de l'État en 2026.",
    "Vous cherchez à réduire le temps de charge de votre voiture électrique à {VILLE} ? Nos installateurs partenaires vous proposent des solutions Wallbox adaptées à votre abonnement monophasé ou triphasé.",
    "Équipez votre garage de {VILLE} d'une wallbox connectée de dernière génération. Pilotez votre consommation depuis votre smartphone et programmez vos charges en fonction des heures creuses Enedis.",
    "Profitez d'une installation soignée de votre borne Wallbox à {VILLE} par des spécialistes de la recharge électrique IRVE intervenant dans tout le département de la Gironde."
  ]
};

const USE_CASE_POOLS: Record<string, string[]> = {
  main: [
    "La pose d'une borne de 7.4 kW à domicile permet de recharger n'importe quel véhicule (Tesla Model Y, Peugeot e-208, Megane E-Tech, BMW i4) en récupérant environ 40 à 50 km d'autonomie par heure de charge.",
    "Pour les foyers disposant d'un abonnement électrique triphasé, l'installation d'une borne de 11 kW ou 22 kW permet de diviser par trois le temps de charge de votre batterie sans risquer de surcharger le réseau grâce au Smart Charging.",
    "Une wallbox installée dans votre garage ou sur votre place de parking à {VILLE} sécurise la charge de votre véhicule en évitant toute surchauffe des câbles grâce à des protections électriques dédiées (interrupteur différentiel de type A-EV et disjoncteur adapté).",
    "Nos techniciens IRVE recommandent l'installation de bornes de grandes marques (Schneider EVlink, Legrand Green'Up Premium, Wallbox Pulsar Plus) équipées d'un câble de type 2 pour s'adapter à l'ensemble des véhicules électriques du marché européen.",
    "Que ce soit pour une recharge quotidienne rapide après vos trajets dans la métropole bordelaise ou pour des trajets vers le bassin d'Arcachon, une borne murale de 7.4 kW assure une flexibilité totale et préserve la durée de vie de votre batterie.",
    "L'installation d'une prise renforcée Green'Up (3.7 kW) peut suffire pour les véhicules hybrides rechargeables, mais pour un véhicule 100% électrique, seule une borne wallbox garantit une recharge complète en une nuit."
  ],
  copropriete: [
    "Pour faire valoir votre droit à la prise, vous devez envoyer un dossier technique détaillé au syndic de copropriété par lettre recommandée. Celui-ci dispose de 3 mois pour inscrire le point à l'ordre du jour de la prochaine AG.",
    "La solution classique consiste à raccorder votre borne de recharge individuelle au tableau général des parties communes (TGBT) de la résidence bordelaise, avec la pose d'un sous-compteur individuel certifié MID pour la facturation des consommations.",
    "Pour les résidences de {VILLE} comptant de nombreuses demandes, nous recommandons une infrastructure collective avec une colonne horizontale Enedis, permettant à chaque résident d'ouvrir un abonnement Linky indépendant.",
    "L'installation d'une borne en sous-sol à {VILLE} exige de respecter des normes de sécurité incendie strictes et d'utiliser du matériel robuste avec un indice de protection IK10 contre les chocs dans les espaces de manœuvre.",
    "Que vous soyez propriétaire occupant ou locataire à {VILLE}, le syndic ne peut s'opposer aux travaux d'installation d'une borne individuelle que pour un motif sérieux et légitime, comme l'existence d'un projet collectif.",
    "La mise en place d'une solution de recharge partagée ou individuelle en copropriété permet de répartir équitablement les coûts de consommation d'électricité grâce à des relevés de télé-relève automatisés ou des badges RFID."
  ],
  wallbox: [
    "Une Wallbox de 7.4 kW en monophasé est idéale pour la majorité des maisons individuelles à {VILLE}. Elle permet de recharger complètement une batterie de 60 kWh (type Megane E-Tech ou Tesla Model 3) en une seule nuit.",
    "Pour les propriétaires disposant d'une installation en triphasé à {VILLE}, les bornes de 11 kW ou 22 kW offrent une vitesse supérieure, chargeant votre véhicule compatible en seulement 3 à 5 heures pour une autonomie maximale.",
    "Les bornes murales sélectionnées par nos électriciens partenaires intègrent un protocole OCPP et une connectivité Bluetooth ou Wi-Fi pour planifier facilement vos sessions de charge depuis une application mobile dédiée.",
    "La pose d'une Wallbox nécessite des protections électriques obligatoires dans votre tableau de {VILLE} : un disjoncteur adapté et un interrupteur différentiel de type A-EV capable de détecter les fuites de courant continu.",
    "Certaines wallbox intelligentes comme la Wallbox Pulsar Plus ou la Legrand Green'Up intègrent un lecteur de carte RFID pour sécuriser l'accès et empêcher les personnes non autorisées de recharger leur véhicule chez vous.",
    "Une borne de recharge rapide est particulièrement recommandée si vous roulez beaucoup en Gironde et avez besoin de récupérer rapidement de l'autonomie entre deux trajets professionnels ou personnels."
  ]
};

const ECO_POOLS: Record<string, string[]> = {
  main: [
    "En programmant la charge de votre véhicule électrique pendant les heures creuses d'Enedis en Gironde (souvent entre 22h et 6h), vous réduisez votre facture d'électricité et divisez par 5 vos dépenses de carburant.",
    "Avec un tarif de recharge à domicile à {VILLE} estimé à moins de 2 € pour 100 km, l'amortissement de votre investissement dans une borne IRVE s'effectue en moins de 18 mois par rapport à un véhicule thermique.",
    "Le crédit d'impôt de 500 € disponible en 2026, combiné à la TVA réduite à 5,5% sur le matériel et la main d'œuvre, rend l'installation d'une borne de recharge particulièrement accessible pour les particuliers.",
    "Grâce aux fonctionnalités intelligentes des wallbox modernes, vous pouvez suivre en temps réel vos consommations et optimiser vos charges pour profiter pleinement des tarifs d'électricité les plus avantageux.",
    "Le pilotage de la charge permet également d'intégrer des panneaux solaires si vous en êtes équipé à {VILLE}, vous permettant de rouler avec une énergie 100% verte et gratuite produite sous le soleil de Gironde.",
    "Éviter les recharges régulières sur les bornes publiques rapides (qui appliquent des tarifs élevés) en rechargeant principalement chez soi à {VILLE} permet de réaliser plus de 1 200 € d'économies annuelles."
  ],
  copropriete: [
    "Grâce au programme ADVENIR spécifique pour la copropriété, vous bénéficiez d'une aide financière couvrant 50% du montant des travaux, avec un plafond de 960 € TTC par point de recharge installé à {VILLE}.",
    "En plus de la prime ADVENIR, l'installation d'une borne en copropriété est éligible au crédit d'impôt de 500 € et à un taux de TVA réduit à 5,5%, ce qui réduit considérablement le coût restant à votre charge.",
    "Raccorder votre borne au compteur des parties communes avec un système de sous-comptage vous permet de ne payer que l'électricité que vous consommez réellement, au tarif négocié par la copropriété.",
    "La recharge en heures creuses au sein de votre résidence à {VILLE} reste de loin la solution la plus économique pour alimenter votre véhicule électrique, préservant ainsi votre budget énergie mensuel.",
    "Le financement de l'infrastructure collective de recharge peut être pris en charge par des opérateurs tiers sans frais pour la copropriété, les utilisateurs payant ensuite un abonnement individuel.",
    "Investir dans une borne en copropriété à {VILLE} permet de réaliser des économies substantielles à long terme en évitant les tarifs excessifs pratiqués sur les réseaux de recharge publics extérieurs."
  ],
  wallbox: [
    "Grâce au pilotage énergétique de votre Wallbox à {VILLE}, la charge s'active automatiquement pendant les heures creuses, vous permettant de rouler pour environ 2 € par recharge complète de votre batterie.",
    "Le crédit d'impôt national pour la pose d'une borne de recharge a été fixé à 500 € par contribuable en 2026, cumulable avec la TVA à 5,5% appliquée par votre installateur IRVE qualifié.",
    "L'installation d'une borne de recharge rapide vous évite d'utiliser régulièrement les chargeurs publics rapides de type DC, dont le coût au kWh est 3 à 4 fois plus élevé que l'électricité domestique à {VILLE}.",
    "Les bornes équipées de capteurs de puissance modulable adaptent leur vitesse de recharge en fonction des autres équipements de votre maison de {VILLE}, vous évitant de payer un abonnement Enedis plus cher.",
    "Si vous possédez une installation photovoltaïque à {VILLE}, certaines wallbox de marque SolarEdge ou Easee peuvent canaliser le surplus de production solaire directement dans la batterie de votre voiture.",
    "Investir dans une wallbox performante à domicile à {VILLE} est rapidement rentabilisé en profitant des tarifs d'électricité régulés d'Enedis et en limitant les recharges d'urgence sur autoroute."
  ]
};

const COMMUNE_DATA_POOLS: Record<string, string[]> = {
  main: [
    "Nos électriciens partenaires analysent la capacité de votre tableau de répartition principal. Souvent, dans le bâti ancien ou les échoppes rénovées de Gironde, une mise aux normes mineure ou l'ajout d'un interrupteur différentiel adapté est requis.",
    "À {VILLE}, nous vérifions systématiquement la qualité de la prise de terre avant toute pose de borne. Une résistance de terre supérieure à 100 Ohms empêcherait le véhicule électrique de démarrer sa charge par sécurité.",
    "Le réseau électrique Enedis à {VILLE} délivre une tension stable, mais la pose d'un module de délestage est indispensable pour les abonnements de 6 kVA afin de ne pas couper le courant lors du démarrage d'appareils gourmands.",
    "L'installation électrique de votre maison doit être auditée par un professionnel IRVE. Dans le 33, de nombreux tableaux nécessitent un simple réagencement pour accueillir le disjoncteur et le différentiel dédiés à la wallbox.",
    "Nos installateurs se chargent de vérifier la puissance souscrite auprès de votre fournisseur. Si un passage de 6 à 9 kVA est nécessaire, nous vous guidons dans les démarches auprès d'Enedis Gironde.",
    "Chaque installation de borne à {VILLE} respecte scrupuleusement le cahier des charges de la norme NF C 15-100, garantissant une protection optimale contre les surcharges et les courts-circuits accidentels."
  ],
  copropriete: [
    "L'installation dans les parkings collectifs de Gironde nécessite l'intervention d'un électricien qualifié IRVE pour garantir la conformité avec le guide technique de l'association Promotelec et les décrets en vigueur.",
    "À {VILLE}, nous analysons le tableau général basse tension (TGBT) de votre copropriété pour déterminer la puissance disponible. Parfois, l'installation d'un gestionnaire d'énergie collectif est requise pour éviter de saturer le réseau.",
    "Le câblage dans un parking souterrain à {VILLE} doit emprunter des chemins de câbles coupe-feu spécifiques pour se conformer à la réglementation sur la sécurité incendie dans les bâtiments d'habitation.",
    "Nos installateurs coordonnent leur travail avec le syndic de votre résidence à {VILLE}. Nous fournissons un schéma d'implantation technique clair pour valider la faisabilité du raccordement électrique.",
    "Dans les résidences du 33, l'accès à la borne est sécurisé par un lecteur de badge ou une clé physique. Cela empêche toute utilisation frauduleuse de votre électricité par un autre résident.",
    "Chaque projet en copropriété à {VILLE} respecte les normes d'accessibilité PMR (Personnes à Mobilité Réduite) pour l'emplacement de la borne et la maniabilité du câble de recharge."
  ],
  wallbox: [
    "L'installation d'une wallbox à {VILLE} doit impérativement être validée par un diagnostic de votre réseau électrique intérieur afin de s'assurer de la bonne section de câble et de la présence d'une prise de terre conforme.",
    "À {VILLE}, de nombreuses installations électriques résidentielles nécessitent la pose d'un module de délestage Linky TIC pour éviter la coupure du disjoncteur général lorsque la borne fonctionne en même temps que le chauffage.",
    "Les techniciens IRVE intervenant à {VILLE} vérifient la conformité de votre tableau électrique principal. Si nécessaire, un tableau secondaire dédié à la borne de recharge sera mis en place pour garantir la sécurité.",
    "Le choix de la puissance de votre borne dépend directement de votre abonnement électrique à {VILLE}. Une borne de 7.4 kW requiert un abonnement minimum de 9 kVA (45 Ampères) pour fonctionner confortablement.",
    "Dans les zones côtières ou forestières de Gironde, nos installateurs veillent à équiper les wallbox extérieures de protections renforcées contre la foudre, l'humidité et les surtensions électriques du réseau.",
    "Toutes les wallbox installées par nos artisans certifiés à {VILLE} respectent les directives européennes et françaises avec des connecteurs de type 2S équipés d'obturateurs de sécurité enfants."
  ]
};

const EXPERT_TIP_POOLS: Record<string, string[]> = {
  main: [
    "Conseil de pro : Privilégiez une borne équipée d'un capteur de courant qui ajuste dynamiquement la charge. C'est l'assurance d'éviter les disjonctions générales sans avoir à augmenter votre abonnement Enedis.",
    "Astuce technique : Si votre borne est installée en extérieur à {VILLE}, exigez une pose sous abri ou une borne certifiée IP55 avec obturateurs de sécurité (prises T2S) pour résister aux embruns et intempéries.",
    "Recommandation IRVE : Ne sous-estimez pas la section du câble d'alimentation de la borne. Pour une borne de 7.4 kW située à 15 mètres du tableau, un câble en cuivre de 10 mm² est indispensable pour éviter les pertes d'énergie.",
    "Avis de l'électricien : Optez pour une borne évolutive compatible OCPP. Cela vous permettra de la connecter facilement à des applications de recharge intelligente ou à un futur système de gestion énergétique domestique.",
    "Conseil sécurité : L'utilisation d'une prise classique pour recharger un VE présente un risque d'échauffement important. La wallbox intègre des circuits de détection de fuite de courant continu pour une protection totale.",
    "Le conseil girondin : En hiver dans le 33, programmez la fin de charge juste avant votre départ. La batterie sera encore tiède, ce qui améliorera l'autonomie et le freinage régénératif dès les premiers kilomètres de votre trajet."
  ],
  copropriete: [
    "Conseil d'expert : N'attendez pas la tenue de l'AG pour envoyer votre dossier en recommandé. Plus vite le syndic reçoit votre demande technique rédigée par nos soins, plus vite la convention de travaux sera signée.",
    "Astuce copro : Proposez au syndic une solution de recharge collective évolutive. Même si vous êtes le premier demandeur à {VILLE}, d'autres voisins suivront et une infrastructure commune évitera de multiplier les câbles individuels.",
    "Recommandation technique : Pour les parkings extérieurs à {VILLE}, optez pour une borne sur pied robuste dotée d'un indice IK10 et d'une trappe verrouillable pour protéger la prise contre le vandalisme.",
    "Le conseil juridique : Rappelez à votre syndic que le droit à la prise est garanti par la loi. Si aucune décision n'est prise dans les 3 mois suivant la réception de votre demande, vous pouvez lancer les travaux individuellement.",
    "Avis de l'électricien : Dans le cas d'une recharge raccordée aux parties communes, assurez-vous que le sous-compteur installé est certifié MID (Mesure Instruments Directive) pour que la facturation soit juridiquement incontestable.",
    "Conseil pratique : Choisissez une borne équipée d'une connectivité Wi-Fi ou 4G pour permettre le suivi de consommation et la mise à jour à distance du micrologiciel de votre équipement de recharge."
  ],
  wallbox: [
    "Le conseil de l'artisan : Pour une borne installée à {VILLE}, choisissez un modèle doté d'une application de contrôle robuste. Cela vous permettra de suivre précisément votre historique de consommation pour votre comptabilité.",
    "Astuce technique : Si vous prévoyez d'acheter un second véhicule électrique à l'avenir, optez dès maintenant pour une borne capable de gérer la charge partagée intelligente entre deux points de charge.",
    "Recommandation IRVE : Évitez les câbles de recharge trop courts. Un câble de 5 ou 7 mètres offre un confort d'utilisation optimal, quelle que soit la position de la trappe de recharge de votre véhicule dans votre allée à {VILLE}.",
    "Conseil d'expert : Pensez à vérifier la garantie constructeur de votre wallbox. Les fabricants leaders (Hager, Schneider, Easee) proposent des extensions de garantie jusqu'à 5 ans qui sécurisent votre investissement.",
    "Avis de l'électricien : Si votre maison à {VILLE} dispose d'une installation en triphasé, préférez une borne de 22 kW bridable à 11 kW. Cela vous donne une flexibilité totale selon les capacités de charge de vos futurs véhicules.",
    "Le conseil technique : Protégez toujours votre investissement. Enroulez soigneusement le câble de charge sur un support mural dédié à {VILLE} après chaque utilisation pour éviter de l'endommager avec le temps."
  ]
};

const REAL_ESTATE_POOLS: Record<string, string[]> = {
  main: [
    "Les agences immobilières de Gironde confirment qu'une maison équipée d'une borne de recharge rapide se vend plus rapidement et gagne une valeur verte immédiate estimée entre 2% et 4% sur le marché immobilier de {VILLE}.",
    "À {VILLE}, la présence d'une wallbox opérationnelle dans le garage est un argument de poids lors des visites d'acquéreurs potentiels, de plus en plus nombreux à posséder ou projeter l'achat d'un véhicule électrique.",
    "Valoriser son patrimoine immobilier passe aujourd'hui par la transition énergétique. Installer une borne IRVE de qualité valorise votre bien tout en le démarquant des autres annonces du secteur de {VILLE}.",
    "Avec l'interdiction progressive des véhicules thermiques, une place de stationnement déjà câblée pour la recharge de véhicules électriques est un équipement standard recherché par les acheteurs à {VILLE}.",
    "Selon les notaires de Gironde, les biens équipés d'une borne de recharge rapide dans le secteur de {VILLE} se négocient avec une décote moindre en période de marché baissier, la valeur verte agissant comme un amortisseur de prix.",
    "Les diagnostiqueurs immobiliers à {VILLE} intègrent désormais la présence d'une borne IRVE dans l'audit énergétique du logement. C'est un critère de différenciation qui séduit une clientèle d'acheteurs CSP+ sensibilisés à la mobilité décarbonée.",
    "À {VILLE}, les programmes de lotissements neufs livrés depuis 2024 intègrent systématiquement un pré-câblage borne de recharge dans le garage. Ne pas équiper une maison existante, c'est prendre du retard sur le standard du marché local.",
    "Le marché de la location saisonnière sur le Bassin d'Arcachon ou le Libournais récompense les propriétaires-bailleurs qui proposent un point de charge privé : les réservations de touristes VE grimpent rapidement avec ce service."
  ],
  copropriete: [
    "Un appartement avec place de parking câblée ou équipée d'une borne à {VILLE} voit sa valeur immobilière augmenter de façon significative. C'est un argument de vente majeur pour les acheteurs urbains de Gironde.",
    "Dans les copropriétés de {VILLE}, disposer d'un équipement IRVE individuel permet de louer ou vendre sa place de parking beaucoup plus facilement et avec une plus-value estimée à plus de 2 000 €.",
    "La valeur verte des logements collectifs à {VILLE} devient un critère de choix pour les locataires et acquéreurs équipés de VE, qui écartent désormais les résidences dépourvues de solution de recharge.",
    "Équiper sa copropriété d'une infrastructure de recharge collective est un investissement qui modernise l'immeuble et préserve l'attractivité immobilière de la copropriété à {VILLE} face aux constructions neuves.",
    "Les résidences collectives de {VILLE} qui anticipent l'équipement IRVE attirent un vivier de locataires actifs roulant en VE. La demande pour des appartements avec parking équipé explose dans toute la Gironde.",
    "D'après les agences immobilières de {VILLE}, un lot de copropriété sans solution de recharge met en moyenne 25% de temps de plus à se vendre qu'un lot équipé ou dans un immeuble pré-câblé.",
    "Les syndics professionnels de Gironde recommandent aux copropriétés de {VILLE} de voter un plan de pré-câblage global pour éviter une dépréciation collective du patrimoine immobilier face aux immeubles neufs conformes RT 2020.",
    "L'installation d'une borne en parking souterrain à {VILLE} est perçue par les banques comme un investissement valorisant : certaines offres de prêt immobilier vert intègrent le financement de la borne dans le prêt principal."
  ],
  wallbox: [
    "L'installation d'une wallbox de marque reconnue valorise immédiatement votre maison à {VILLE} en augmentant sa valeur verte de 3% à 5% auprès des acquéreurs de plus en plus attentifs aux équipements de recharge à domicile.",
    "Avoir une borne de recharge rapide pré-équipée dans son garage est un critère de confort haut de gamme très recherché lors des transactions immobilières dans le secteur de {VILLE}.",
    "Un logement prêt pour la mobilité électrique à {VILLE} se vend en moyenne 15 jours plus vite sur le marché de Gironde, les acheteurs appréciant de ne pas avoir à réaliser ces travaux complexes eux-mêmes.",
    "En Gironde, les maisons disposant d'un carport ou d'un garage équipé d'une wallbox 7.4 kW se positionnent en tête des recherches immobilières des jeunes couples actifs roulant en électrique.",
    "Les diagnostiqueurs DPE du secteur de {VILLE} signalent que les acquéreurs demandent de plus en plus souvent si la maison est pré-équipée pour la recharge d'un véhicule électrique avant même de visiter le bien.",
    "Une maison avec wallbox 11 kW et abonnement triphasé à {VILLE} représente un argument décisif face à la concurrence des constructions neuves RT 2020, qui intègrent systématiquement le pré-câblage IRVE.",
    "Le retour sur investissement d'une wallbox à {VILLE} ne se mesure pas uniquement en économies de carburant : la plus-value immobilière générée peut atteindre 8 000 à 12 000 € lors de la revente du bien.",
    "Les mandataires immobiliers spécialisés en standing à {VILLE} incluent désormais la wallbox dans les critères de recherche premium au même titre que la piscine ou la domotique."
  ]
};

const POPULATION_TIER_POOLS: Record<string, string[]> = {
  main: [
    "Avec une population locale active et un tissu urbain en pleine mutation, {VILLE} encourage le développement des mobilités douces et de l'électromobilité. Installer sa borne privée est le moyen idéal de devancer les futures réglementations.",
    "Dans cette commune dynamique du 33, le nombre d'utilisateurs de véhicules propres augmente rapidement. Pouvoir recharger chez soi reste le moyen le plus confortable et le plus économique pour vos trajets quotidiens.",
    "Les infrastructures publiques de recharge se développent à {VILLE}, mais elles ne remplaceront jamais la sérénité et le tarif avantageux d'une recharge nocturne effectuée directement dans votre allée ou garage.",
    "En tant que commune accueillante du département de la Gironde, {VILLE} voit sa part de voitures électriques grandir. Nos électriciens locaux contribuent activement à cette transition en équipant les foyers de bornes fiables.",
    "Les trajets domicile-travail depuis {VILLE} vers Bordeaux ou les pôles d'activités de Gironde sont idéalement couverts par une recharge nocturne à domicile. Un plein électrique chaque matin sans passer par une station-service, c'est le nouveau standard.",
    "La qualité de vie à {VILLE} passe aussi par la maîtrise de ses coûts de déplacement. Une borne de recharge IRVE à domicile permet de diviser par 5 le budget carburant mensuel des foyers qui parcourent 30 à 60 km par jour.",
    "Le réseau de transports en commun de Gironde complète l'offre de mobilité à {VILLE}, mais pour les trajets péri-urbains et les courses du quotidien, la voiture électrique rechargée à domicile reste imbattable en souplesse et en coût.",
    "L'évolution rapide du parc automobile à {VILLE} montre que les véhicules 100% électriques dépassent désormais les hybrides dans les nouvelles immatriculations. Cette tendance confirme le besoin d'équiper les domiciles en bornes de recharge rapide."
  ],
  copropriete: [
    "Dans les zones denses de {VILLE}, où le logement collectif représente une part importante du parc immobilier, l'adaptation des copropriétés à la recharge électrique est un enjeu écologique et économique majeur.",
    "Le nombre croissant de résidents roulant en électrique à {VILLE} pousse les syndics de copropriété à moderniser les installations de stationnement pour offrir des solutions de charge partagées ou individuelles.",
    "À {VILLE}, de nombreuses résidences collectives se tournent vers nos électriciens IRVE pour déployer des infrastructures prêtes à l'emploi, anticipant ainsi la généralisation des véhicules électriques.",
    "Installer une borne dans son immeuble à {VILLE} permet de s'affranchir de la recherche quotidienne d'une borne publique disponible dans le quartier, tout en profitant du confort d'une recharge à domicile.",
    "La densité de population à {VILLE} rend les bornes publiques souvent saturées aux heures de pointe. Les copropriétaires avisés préfèrent investir dans un point de charge privatif dans leur parking pour s'assurer une disponibilité garantie.",
    "Les bailleurs sociaux de Gironde commencent à équiper leurs résidences à {VILLE} en bornes de recharge partagées. Cette tendance témoigne d'un besoin massif, y compris dans les logements collectifs à loyer modéré.",
    "Le programme local de rénovation urbaine à {VILLE} intègre désormais systématiquement le pré-câblage des parkings pour la recharge électrique, preuve que la mobilité décarbonée est au cœur de la planification urbaine de Gironde.",
    "Les conseils syndicaux de {VILLE} sont de plus en plus sollicités par les copropriétaires souhaitant installer une borne. L'anticipation collective évite des travaux individuels coûteux et garantit une infrastructure cohérente et pérenne."
  ],
  wallbox: [
    "À {VILLE}, la transition vers la voiture électrique est en marche. Disposer d'une wallbox rapide à domicile est la solution la plus pratique pour recharger chaque soir et démarrer la journée avec une batterie pleine.",
    "Le développement urbain de {VILLE} s'accompagne d'une demande croissante pour des solutions de charge résidentielles rapides, portées par des électriciens locaux certifiés IRVE.",
    "Même si la ville de {VILLE} déploie de nouvelles bornes publiques, la wallbox privée reste l'équipement indispensable pour recharger au meilleur tarif sans contrainte de temps ni d'attente.",
    "En choisissant d'installer une borne rapide chez vous à {VILLE}, vous rejoignez les nombreux foyers du 33 qui ont fait le choix d'une mobilité simplifiée et économique au quotidien.",
    "Les résidents de {VILLE} qui optent pour une wallbox témoignent d'un gain de confort majeur : finies les files d'attente sur les superchargeurs en zone commerciale pour quelques dizaines de kilomètres d'autonomie.",
    "L'engouement pour les véhicules électriques à {VILLE} dépasse la simple tendance écologique. C'est un choix économique rationnel quand on dispose d'une wallbox 7.4 kW alimentée en heures creuses Enedis à 0,16 €/kWh.",
    "Les familles de {VILLE} avec deux véhicules constatent qu'une seule wallbox 7.4 kW suffit pour couvrir les besoins de recharge de deux voitures, à condition de programmer les charges en alternance via l'application mobile.",
    "La généralisation du télétravail à {VILLE} renforce l'intérêt de la wallbox domestique : le véhicule est garé plus longtemps à domicile, ce qui permet une recharge complète même en heures creuses de 6 heures."
  ]
};

// FAQ Pools (16 items to ensure high entropy)
const FAQ_POOLS: Record<string, { question: string; answer: string }[]> = {
  main: [
    { question: "Faut-il modifier mon compteur Enedis pour une installation de borne à {VILLE} ?", answer: "Si vous optez pour une borne de 7.4 kW en monophasé, un abonnement de 9 kVA (45 A) est généralement recommandé. Pour une borne de 11 kW ou 22 kW en triphasé, il est nécessaire de demander à Enedis Gironde de modifier votre raccordement pour passer en triphasé." },
    { question: "Quel est le tarif moyen d'un électricien IRVE pour poser une borne à {VILLE} ?", answer: "Le coût moyen oscille entre 1 200 € et 1 800 € TTC avant déduction des aides financières. Ce tarif comprend la fourniture de la wallbox, le disjoncteur différentiel adapté, le câblage et la mise en service réglementaire." },
    { question: "Existe-t-il des subventions locales ou départementales en Gironde ?", answer: "En plus du crédit d'impôt national de 500 € et de la TVA réduite à 5,5%, certaines collectivités locales ou des bonus liés à la ZFE de Bordeaux Métropole proposent des aides complémentaires pour l'acquisition d'un véhicule propre et de sa borne." },
    { question: "Combien de temps durent les travaux de pose d'une borne à {VILLE} ?", answer: "Dans la grande majorité des cas, l'installation d'une borne de recharge dans une maison individuelle à {VILLE} prend entre une demi-journée et une journée complète, selon la distance entre le tableau électrique et l'emplacement de la borne." },
    { question: "Quelle est la différence entre une prise Green'Up et une borne Wallbox ?", answer: "La prise Green'Up charge à 3.7 kW (environ 15-20 km d'autonomie par heure), tandis qu'une wallbox classique charge à 7.4 kW ou plus (jusqu'à 50 km par heure). La wallbox est donc deux fois plus rapide et intègre des fonctions de pilotage intelligent." },
    { question: "Puis-je installer ma borne moi-même pour économiser sur la main d'œuvre ?", answer: "Non, la loi française impose que toute borne d'une puissance supérieure à 3.7 kW soit installée par un professionnel certifié IRVE. De plus, les assurances refusent tout remboursement en cas de sinistre si cette certification n'est pas fournie." },
    { question: "Le délestage dynamique est-il obligatoire pour ma wallbox à {VILLE} ?", answer: "Ce n'est pas obligatoire mais fortement conseillé. Le délestage dynamique (ou Smart Charging) adapte en temps réel la puissance de charge de la borne en fonction de la consommation globale de votre foyer pour éviter les disjonctions générales." },
    { question: "Quelle est la durée de garantie d'une wallbox posée à {VILLE} ?", answer: "Les modèles sélectionnés par nos installateurs partenaires bénéficient de garanties constructeur de 2 à 5 ans. Faire installer votre équipement par un professionnel IRVE garantit le maintien de la garantie du véhicule et de la borne." },
    { question: "Les aides de l'État sont-elles valables en maison secondaire en Gironde ?", answer: "Oui, le crédit d'impôt de 500 € s'applique aussi bien sur votre résidence principale que secondaire (dans la limite d'un équipement par foyer fiscal pour une même habitation)." },
    { question: "Quelle puissance choisir : 7.4 kW, 11 kW ou 22 kW ?", answer: "Le standard en monophasé est 7.4 kW. Si votre maison dispose du triphasé, 11 kW ou 22 kW sont possibles et réduiront drastiquement le temps de charge si votre chargeur embarqué est compatible." },
    { question: "Comment est calculée la section du câble pour alimenter ma borne ?", answer: "Elle est déterminée par la norme NF C 15-100 selon l'intensité maximale (32A pour une borne de 7.4 kW) et la distance. On utilise du 10 mm² de section en cuivre pour une distance courante." },
    { question: "Puis-je recharger pendant que je cuisine et fais tourner mes lessives ?", answer: "Oui, grâce au module de délestage dynamique connecté au compteur Linky. La borne diminue temporairement sa puissance si vos appareils de cuisine consomment trop." },
    { question: "Les bornes de recharge sont-elles étanches en extérieur à {VILLE} ?", answer: "Oui, les modèles extérieurs possèdent un indice de protection IP54 ou IP55 minimum, ce qui les rend étanches à la pluie et à la poussière pour une installation sur un mur extérieur ou un pied de fixation." },
    { question: "La prise de terre est-elle obligatoire pour recharger mon VE ?", answer: "Oui, et elle doit être inférieure à 100 Ohms. Si la terre est absente ou défaillante, le véhicule refusera de charger par sécurité." },
    { question: "Quelle marque de borne est la plus fiable en 2026 ?", answer: "Schneider Electric, Wallbox (Pulsar), Legrand et Hager sont les leaders. Le choix dépend surtout de la compatibilité avec vos besoins (application, lecteur RFID, design)." },
    { question: "Comment demander les devis gratuits sur ce site ?", answer: "Il suffit de remplir notre formulaire en 5 étapes rapides. Vos données sont envoyées de manière sécurisée aux artisans IRVE qualifiés proches de {VILLE} qui vous recontactent sous 48 heures." }
  ],
  copropriete: [
    { question: "Qu'est-ce que le droit à la prise en copropriété à {VILLE} ?", answer: "C'est un droit légal qui permet à tout résident d'installer une borne de recharge à ses frais sur sa place de parking privative en sous-sol ou en extérieur. Le syndic ne peut s'y opposer sans motif sérieux et légitime sous 3 mois." },
    { question: "Quel est le montant de l'aide ADVENIR pour une copropriété à {VILLE} ?", answer: "L'aide finance 50% du montant HT des travaux de raccordement et de pose de la borne individuelle, avec un plafond maximal fixé à 960 € TTC par place équipée." },
    { question: "Comment le syndic facture-t-il l'électricité consommée par ma borne ?", answer: "Soit la borne est raccordée à un compteur Linky individuel ouvert à votre nom, soit elle est connectée aux parties communes avec un sous-compteur MID certifié permettant une refacturation précise de vos kWh par le syndic." },
    { question: "Qui paye pour les travaux d'infrastructure collective dans mon immeuble ?", answer: "L'infrastructure collective peut être financée par le programme ADVENIR collectif et par les résidents qui décident de s'équiper. Des opérateurs tiers proposent également d'installer le réseau gratuitement en échange d'un abonnement." },
    { question: "Combien de temps faut-il pour obtenir l'accord du syndic à {VILLE} ?", answer: "Une fois le dossier technique envoyé en recommandé au syndic, celui-ci a 3 mois pour inscrire la convention de travaux à l'ordre du jour. Les travaux peuvent ensuite démarrer après signature." },
    { question: "Quelles pièces techniques doit contenir mon dossier envoyé au syndic ?", answer: "Il doit inclure un schéma unifilaire de l'installation, le descriptif de la borne choisie, la attestation IRVE de l'électricien et le tracé du passage des câbles dans les chemins de câbles communs." },
    { question: "Puis-je installer une borne si je suis locataire de ma place à {VILLE} ?", answer: "Oui, le droit à la prise s'applique aussi aux locataires. Vous devez notifier votre propriétaire et le syndic. Le coût des travaux reste à votre charge (déduction faite des subventions)." },
    { question: "Que se passe-t-il si le syndic refuse mon droit à la prise ?", answer: "Le syndic doit saisir le tribunal d'instance sous 3 mois s'il souhaite s'opposer aux travaux pour un motif légitime (comme la présence d'une solution collective). Sans action de sa part, vous pouvez procéder aux travaux." },
    { question: "Peut-on installer des bornes dans un parking extérieur de copropriété ?", answer: "Oui, la réglementation couvre également les parkings extérieurs privatifs. L'installateur IRVE posera la borne sur un pied de fixation métallique étanche." },
    { question: "La prime ADVENIR est-elle directement déduite de la facture de l'artisan ?", answer: "Oui, les installateurs certifiés partenaires se chargent de monter le dossier ADVENIR pour vous et déduisent la prime directement de votre devis." },
    { question: "Qu'est-ce qu'une colonne horizontale Enedis en copropriété ?", answer: "C'est une extension du réseau public de distribution électrique dans les parkings souterrains. Elle permet à chaque place de disposer d'un compteur Linky indépendant." },
    { question: "Quelles sont les normes incendie requises en sous-sol à {VILLE} ?", answer: "Les chemins de câbles doivent respecter des normes coupe-feu, et les bornes doivent posséder des disjoncteurs automatiques pour couper l'alimentation en cas d'alerte incendie générale de l'immeuble." },
    { question: "Peut-on partager une borne à deux voisins de parking à {VILLE} ?", answer: "Oui, c'est possible si la borne possède un double badge RFID pour distinguer et facturer séparément les consommations de chaque résident." },
    { question: "Le syndic peut-il m'imposer un installateur spécifique ?", answer: "Non, vous êtes libre de choisir votre installateur IRVE. Toutefois, si la copropriété a déjà signé une convention avec un opérateur réseau, vous devez passer par cet opérateur." },
    { question: "La TVA réduite à 5,5% s'applique-t-elle aussi en copropriété ?", answer: "Oui, elle s'applique sur l'ensemble de la facture (matériel et main d'œuvre de pose) si la résidence a plus de deux ans." },
    { question: "Quelle puissance choisir pour une borne en copropriété à {VILLE} ?", answer: "La puissance maximale autorisée individuellement en copropriété est généralement bridée à 7.4 kW pour préserver l'équilibre électrique global du bâtiment." }
  ],
  wallbox: [
    { question: "Qu'est-ce qu'une Wallbox par rapport à un chargeur classique ?", answer: "Une Wallbox est un boîtier mural de recharge rapide et sécurisé qui communique de façon intelligente avec le véhicule pour optimiser les temps de charge et éviter les surchauffes électriques." },
    { question: "Est-il nécessaire d'avoir le triphasé chez soi à {VILLE} pour poser une wallbox ?", answer: "Non. Une wallbox de 7.4 kW fonctionne parfaitement sur un réseau monophasé 230V classique. Le triphasé 400V n'est requis que si vous souhaitez charger à 11 kW ou 22 kW." },
    { question: "Quelle est la vitesse de charge d'une wallbox connectée ?", answer: "Avec une puissance standard de 7.4 kW, vous rechargez environ 45 km d'autonomie par heure, ce qui permet de faire le plein d'une voiture moyenne en 6 à 8 heures de nuit." },
    { question: "Comment fonctionne la programmation heures creuses sur une wallbox ?", answer: "Vous pouvez programmer les heures de charge via l'application smartphone de la borne ou l'écran du véhicule, afin que la charge ne démarre que lorsque le tarif Enedis est le plus bas." },
    { question: "Quels sont les disjoncteurs obligatoires pour sécuriser ma wallbox à {VILLE} ?", answer: "Il faut installer un disjoncteur différentiel de 40A de type F (ou type B pour certains modèles) et un disjoncteur divisionnaire dédié de 32A." },
    { question: "Une wallbox extérieure craint-elle le gel ou les fortes pluies en Gironde ?", answer: "Non, les wallbox de grandes marques sont conçues avec des indices de protection IP54 ou IP55, ce qui garantit leur étanchéité complète face aux intempéries." },
    { question: "Qu'est-ce que le Smart Charging ou charge bidirectionnelle ?", answer: "Le Smart Charging pilote la puissance en fonction du réseau. La charge bidirectionnelle (V2G/V2H) permettra à l'avenir de renvoyer l'énergie de la batterie du véhicule pour alimenter la maison." },
    { question: "Combien coûte l'entretien annuel d'une wallbox à {VILLE} ?", answer: "Il n'y a pas d'entretien obligatoire payant pour les particuliers. Il est conseillé de faire vérifier l'état des connexions de terre par votre installateur IRVE tous les 2 ou 3 ans." },
    { question: "Puis-je verrouiller ma wallbox si elle est posée à l'extérieur ?", answer: "Oui, la plupart des modèles récents possèdent un verrouillage électronique par mot de passe via l'application mobile ou nécessitent le passage d'un badge RFID physique pour démarrer." },
    { question: "Quelles sont les meilleures marques de wallbox en 2026 ?", answer: "Les marques les plus fiables et posées par nos techniciens en Gironde sont Schneider (EVlink), Legrand (Green'Up Premium), Hager (Witty) et Wallbox (Pulsar Plus)." },
    { question: "Le câble de charge est-il toujours fourni avec la wallbox ?", answer: "La borne est généralement vendue seule (avec prise femelle T2S avec obturateurs), et le câble de recharge Type 2 est celui fourni avec votre véhicule ou acheté séparément." },
    { question: "Puis-je charger une Tesla sur une wallbox d'une autre marque ?", answer: "Oui. Toutes les bornes installées en France utilisent le connecteur standard européen Type 2, compatible avec 100% des véhicules électriques (Tesla, Renault, Peugeot, etc.)." },
    { question: "Est-ce qu'une prise renforcée Green'Up est considérée comme une wallbox ?", answer: "Non, la prise Green'Up charge à 3.7 kW maximum sans communication intelligente avec le véhicule. La wallbox charge au minimum à 7.4 kW et intègre des contrôles intelligents." },
    { question: "La wallbox préserve-t-elle la santé de la batterie de ma voiture ?", answer: "Oui, en rechargeant en courant alternatif lent (AC) par rapport aux superchargeurs rapides de station-service (DC) qui font chauffer et usent prématurément la batterie." },
    { question: "Puis-je utiliser ma wallbox pour charger deux voitures ?", answer: "Oui, soit l'une après l'autre, soit en achetant un modèle double prise équipé d'une fonction de répartition dynamique de puissance." },
    { question: "Comment se déroule la visite technique avant la pose à {VILLE} ?", answer: "L'installateur IRVE étudie l'emplacement de votre tableau électrique, calcule la distance de câblage, teste la valeur de la prise de terre et vérifie si des travaux de maçonnerie ou tranchées sont nécessaires." }
  ]
};

// Spintax template components
const LOGISTICS_ALERT_POOLS = [
  "⚠️ **Important pour votre installation :** L'article R. 111-1 du Code de la construction et de l'habitation régit la pose d'équipements en copropriété. De plus, tout projet d'une puissance supérieure à 3.7 kW exige légalement l'intervention d'un artisan certifié IRVE pour maintenir la validité de votre assurance incendie.",
  "⚠️ **Rappel réglementaire :** La norme électrique NF C 15-100 encadre strictement la pose des points de charge rapides. Confier le raccordement à un électricien certifié IRVE est requis pour obtenir le crédit d'impôt de 500 € et être couvert par vos garanties d'assurance.",
  "⚠️ **Vigilance technique :** Recharger son véhicule électrique sur une prise domestique non protégée présente un risque majeur d'échauffement des lignes. L'installation d'une wallbox exige une protection dédiée (interrupteur différentiel courbe F ou B).",
  "⚠️ **Alerte conformité :** Les constructeurs automobiles peuvent refuser la prise en garantie de la batterie de traction si l'installation de charge à votre domicile ne respecte pas le décret du 12 janvier 2017 imposant un poseur agréé IRVE.",
  "⚠️ **Conseil d'installation :** Pensez à vérifier la valeur de la prise de terre de votre échoppe ou maison. Une terre défaillante (supérieure à 100 Ohms) bloque le démarrage de la charge par mesure de protection électronique du véhicule.",
  "⚠️ **Loi LOM (Orientation des Mobilités) :** Les parkings des bâtiments neufs ou rénovés de Gironde doivent être pré-équipés pour la recharge électrique. Nos solutions de raccordement s'adaptent à cette transition obligatoire."
];

const PRICES_CONTEXT_POOLS = [
  "Les tarifs ci-dessus représentent des moyennes observées en Gironde (33) pour des chantiers standards incluant la fourniture de la borne et jusqu'à 5 mètres de câblage direct. Les travaux de génie civil supplémentaires (creusement de tranchées dans le jardin, percement de murs en pierre blonde, etc.) feront l'objet d'une tarification complémentaire.",
  "Ce barème est indicatif et basé sur les devis d'électriciens qualifiés IRVE exerçant autour de la métropole bordelaise. Le montant final de la facture peut être réduit grâce à la déduction directe de la TVA à 5,5% et à la récupération du crédit d'impôt de 500 € l'année suivante.",
  "Chaque devis d'installation comprend la pose du matériel, l'ajout des modules de sécurité électrique obligatoires dans votre tableau de répartition et la certification finale de conformité. Les prix varient selon l'accessibilité du câblage.",
  "Pour les copropriétés, la prime ADVENIR vient rembourser jusqu'à 50% du montant HT des travaux de raccordement. La visite technique de l'artisan local permet d'obtenir un chiffrage précis adapté aux contraintes de votre place de parking.",
  "Le coût du matériel (bornes intelligentes avec application de suivi de charge, RFID, etc.) représente environ 60% du budget total. L'achat groupé de bornes en lotissement ou copropriété permet de négocier des remises de main d'œuvre.",
  "La modification de votre abonnement ou le passage en triphasé pour les puissances de 11/22 kW engendre des coûts de mise en service spécifiques facturés par Enedis, indépendamment de la main d'œuvre de votre électricien IRVE."
];

const TABLE_INTRO_POOLS = [
  "Découvrez les fourchettes de prix moyens posés TTC constatés auprès de nos artisans partenaires dans votre secteur géographique :",
  "Voici le barème tarifaire complet incluant la borne de recharge, les protections électriques requises et la main d'œuvre IRVE :",
  "Consultez les prix moyens d'installation pour équiper votre habitation (devis brut avant application des subventions nationales) :",
  "Tableau comparatif des budgets d'installation observés selon la puissance et le type d'équipement de recharge choisi :"
];

function selectRotatedItems(itemCount: number, slug: string, offset: number, count: number): number[] {
  const selected: number[] = [];
  const indices = new Set<number>();
  let seed = offset;
  while (selected.length < count && selected.length < itemCount) {
    const idx = getVariantIndex(slug, seed, itemCount);
    if (!indices.has(idx)) {
      indices.add(idx);
      selected.push(idx);
    }
    seed++;
  }
  return selected;
}

export function generateCommuneContent(commune: Commune, category: 'main' | 'copropriete' | 'wallbox'): LocalContent {
  const catOffset = CATEGORY_OFFSETS[category];
  const slug = commune.slug;
  const name = commune.nom;
  const cp = commune.codePostal;

  // Spin sentences based on commune properties
  const introIdx = getVariantIndex(slug, catOffset + 10, INTRO_POOLS[category].length);
  const useCaseIdx = getVariantIndex(slug, catOffset + 20, USE_CASE_POOLS[category].length);
  const ecoIdx = getVariantIndex(slug, catOffset + 30, ECO_POOLS[category].length);
  const dataIdx = getVariantIndex(slug, catOffset + 40, COMMUNE_DATA_POOLS[category].length);
  const expertIdx = getVariantIndex(slug, catOffset + 50, EXPERT_TIP_POOLS[category].length);
  const realEstateIdx = getVariantIndex(slug, catOffset + 60, REAL_ESTATE_POOLS[category].length);
  const popIdx = getVariantIndex(slug, catOffset + 70, POPULATION_TIER_POOLS[category].length);
  const logisticsIdx = getVariantIndex(slug, catOffset + 80, LOGISTICS_ALERT_POOLS.length);
  const pricesIdx = getVariantIndex(slug, catOffset + 85, PRICES_CONTEXT_POOLS.length);
  const tableIntroIdx = getVariantIndex(slug, catOffset + 90, TABLE_INTRO_POOLS.length);

  const rawIntro = INTRO_POOLS[category][introIdx];
  const rawUseCase = USE_CASE_POOLS[category][useCaseIdx];
  const rawEco = ECO_POOLS[category][ecoIdx];
  const rawData = COMMUNE_DATA_POOLS[category][dataIdx];
  const rawExpert = EXPERT_TIP_POOLS[category][expertIdx];
  const rawRealEstate = REAL_ESTATE_POOLS[category][realEstateIdx];
  const rawPop = POPULATION_TIER_POOLS[category][popIdx];

  const introParagraph = spin(rawIntro, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);
  const useCaseText = spin(rawUseCase, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);
  const ecoText = spin(rawEco, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);
  const communeDataInsight = spin(rawData, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);
  const expertTip = spin(rawExpert, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);
  const realEstateInsight = spin(rawRealEstate, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);
  const populationTierContent = spin(rawPop, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp);

  const logisticsAlert = spin(LOGISTICS_ALERT_POOLS[logisticsIdx], slug);
  const pricesContext = spin(PRICES_CONTEXT_POOLS[pricesIdx], slug);
  const tableIntro = spin(TABLE_INTRO_POOLS[tableIntroIdx], slug);

  // FAQ selection & rotation (6 questions out of 16)
  const selectedFaqIndices = selectRotatedItems(FAQ_POOLS[category].length, slug, catOffset, 6);
  const faqItems = selectedFaqIndices.map(idx => {
    const faq = FAQ_POOLS[category][idx];
    return {
      question: spin(faq.question, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp),
      answer: spin(faq.answer, slug).replace(/{VILLE}/g, name).replace(/{CODE_POSTAL}/g, cp)
    };
  });

  const zone = getClimateZone(cp, slug);
  const agency = getLocalAgency(cp, slug);
  
  let climateZoneLabel = "Gironde Sud-Ouest";
  if (zone === 'bordeaux-metropole') climateZoneLabel = "Bordeaux Métropole ZFE";
  else if (zone === 'bassin-arcachon') climateZoneLabel = "Bassin d'Arcachon";

  // Data driven analysis fields for unique SEO value
  const prices = getDynamicPrices(commune);
  const formattedPriceMin = prices.wallbox7kW.min;
  const formattedPriceMax = prices.wallbox7kW.max;

  // ---- DYNAMIC localContext (varies by zone + housing profile) ----
  const LOCAL_CONTEXT_POOLS: string[] = [
    `L'habitat à ${name} se compose ${commune.logementsMaison && commune.logementsMaison > 60 ? 'majoritairement de maisons individuelles avec garage ou abri' : commune.logementsMaison && commune.logementsMaison > 35 ? 'd\'un tissu mixte entre pavillonnaire et collectif' : 'principalement de logements collectifs avec places de parking en sous-sol'}. Cette configuration ${commune.logementsMaison && commune.logementsMaison > 60 ? 'est idéale pour une installation en monophasé directement au tableau du garage' : 'nécessite une étude de raccordement spécifique par un électricien IRVE'}. ${commune.logements ? `On dénombre environ ${commune.logements.toLocaleString('fr-FR')} logements sur la commune.` : ''}`,
    `Les spécificités architecturales du bâti de ${name}${zone === 'bordeaux-metropole' ? ' — échoppes en pierre blonde de l\'ère haussmannienne, immeubles Art Déco des boulevards —' : zone === 'bassin-arcachon' ? ' — villas à ossature bois sur pilotis, cabanes ostréicoles rénovées —' : ' — maisons de caractère en pierre de taille, longères vigneronnes —'} exigent un savoir-faire adapté pour le passage discret des câbles d'alimentation et la conformité avec les prescriptions des Architectes des Bâtiments de France (ABF) lorsque le bâtiment est en secteur protégé.`,
    `Le parc immobilier de ${name} (${commune.tauxMaisonLabel || 'habitat varié'}) offre ${commune.logementsMaison && commune.logementsMaison > 50 ? 'un potentiel massif d\'équipement en bornes résidentielles individuelles' : 'des opportunités mixtes d\'installation, tant en maison individuelle qu\'en copropriété'}. Nos techniciens IRVE adaptent chaque projet aux contraintes locales du réseau Enedis (section des câbles, distance au TGBT, qualité de la prise de terre) pour assurer une installation conforme à la norme NF C 15-100.`,
    `Sur le territoire de ${commune.intercommunalite || 'la communauté de communes'}, ${name} bénéficie d'un cadre propice à la transition vers la mobilité électrique. ${commune.bornesPubliques ? `La commune dispose de ${commune.bornesPubliques} borne(s) publique(s) répertoriée(s), mais` : 'Le réseau de bornes publiques restant limité,'} l'installation d'un point de charge privatif dans votre ${commune.logementsMaison && commune.logementsMaison > 60 ? 'garage ou carport' : 'emplacement de stationnement'} reste le moyen le plus fiable et économique de recharger chaque nuit.`,
    `Avec un prix moyen du m² de ${commune.prixM2Moyen || 'N/A'} € et un profil de commune de type « ${commune.profilCommune || 'ville résidentielle'} », ${name} attire des propriétaires soucieux de valoriser leur patrimoine immobilier. L'ajout d'une borne de recharge certifiée IRVE augmente la valeur verte du bien et le positionne dans les critères de recherche des acheteurs de véhicules électriques.`,
    `Le canton de ${commune.canton || name} auquel appartient ${name} connaît un développement significatif de l'électromobilité. ${commune.vehiculesElectriques ? `On y recense environ ${commune.vehiculesElectriques.toLocaleString('fr-FR')} véhicules électriques immatriculés,` : 'Le nombre de véhicules électriques augmente rapidement,'} confirmant l'intérêt d'une infrastructure de recharge résidentielle adaptée au profil d'habitat local (${commune.tauxMaisonLabel || 'habitat varié'}).`,
  ];
  const localContextIdx = getVariantIndex(slug, catOffset + 95, LOCAL_CONTEXT_POOLS.length);
  const localContext = LOCAL_CONTEXT_POOLS[localContextIdx];

  // ---- DYNAMIC savingsEstimate (calculated from distance data) ----
  const avgDailyKm = commune.distanceBordeaux ? Math.min(commune.distanceBordeaux * 2, 120) + 15 : 40;
  const annualKm = avgDailyKm * 230; // 230 working days
  const elecCostPer100km = 2.10;
  const essenceCostPer100km = 12.50;
  const annualSavings = Math.round(annualKm * (essenceCostPer100km - elecCostPer100km) / 100);
  const costPer100kmFormatted = (elecCostPer100km).toFixed(2).replace('.', ',');
  const savingsEstimate = `environ **${annualSavings.toLocaleString('fr-FR')} € par an** sur votre budget carburant (base de ${avgDailyKm} km/jour × 230 jours ouvrés), avec un coût kilométrique de recharge estimé à **${costPer100kmFormatted} € pour 100 km** pendant les heures creuses Enedis à ${name}.`;

  const lastUpdated = "Juin 2026";

  const densiteAnalysis = `Avec une population de ${commune.population?.toLocaleString('fr-FR')} habitants, la commune de ${name} dispose d'un réseau de recharge local. L'analyse des données d'infrastructure montre une densité moyenne de bornes de recharge de ${commune.densiteBornes} points de charge pour 1 000 habitants, avec un taux de croissance annuel estimé à ${commune.croissanceVE}% de véhicules rechargeables enregistrés en Gironde en 2026.`;

  const marcheImmobilierInsight = `Le marché immobilier local de ${name} est classifié comme **${commune.marcheImmobilier}** avec un prix moyen au m² estimé à **${commune.prixM2Moyen} € / m²**. Équiper son logement d'une borne de recharge certifiée IRVE représente un actif valorisant lors de la revente, augmentant l'attractivité auprès des futurs acquéreurs de véhicules électriques.`;

  // ---- DYNAMIC distanceBordeauxContext (5 tiers with local road references) ----
  const dist = commune.distanceBordeaux || 15;
  let distanceBordeauxContext: string;
  if (dist <= 10) {
    distanceBordeauxContext = `Située à seulement ${dist} km du cœur de Bordeaux, ${name} est desservie par le réseau de tramway ou de bus TBM de la métropole. Malgré cette proximité, disposer de sa propre borne de recharge à domicile reste l'option la plus économique et la plus confortable pour recharger votre véhicule chaque nuit, en évitant les files d'attente aux bornes publiques du centre-ville.`;
  } else if (dist <= 25) {
    distanceBordeauxContext = `À ${dist} km de Bordeaux, ${name} se trouve dans la première couronne périurbaine de l'agglomération bordelaise. Les trajets quotidiens via la rocade (A630) ou les axes départementaux rendent indispensable une borne de recharge rapide à domicile pour récupérer sereinement l'autonomie consommée entre vos allers-retours vers la métropole.`;
  } else if (dist <= 45) {
    distanceBordeauxContext = `Positionnée à ${dist} km de Bordeaux, ${name} bénéficie d'un accès aux infrastructures métropolitaines via ${zone === 'bassin-arcachon' ? 'l\'A63 et l\'A660 vers le Bassin d\'Arcachon' : 'l\'A89 (axe Bordeaux-Libourne) ou la N89'}. Pour couvrir cette distance quotidiennement en véhicule électrique, une borne domestique de 7.4 kW minimum est recommandée afin de recharger entièrement la batterie en une nuit.`;
  } else if (dist <= 65) {
    distanceBordeauxContext = `Éloignée de ${dist} km de la métropole bordelaise, ${name} se situe dans l'arrière-pays girondin. Les conducteurs de VE empruntant ${zone === 'libournais-medoc' ? 'la D1215 (route du Médoc) ou la N89 vers le Libournais' : 'les axes départementaux reliant le territoire au littoral'} parcourent une distance significative au quotidien. Une wallbox 7.4 kW voire 11 kW assure une recharge complète chaque nuit sans stress d'autonomie.`;
  } else {
    distanceBordeauxContext = `Commune rurale située à ${dist} km de Bordeaux, ${name} se trouve aux confins du département de la Gironde. Les longs trajets vers la métropole ou le littoral (parfois plus de 100 km aller-retour) imposent une borne de recharge rapide domestique (11 kW triphasé recommandé) pour garantir une autonomie suffisante et éviter les détours vers les rares bornes publiques de la zone.`;
  }

  // ---- DYNAMIC localRegulation (varies by zone) ----
  const LOCAL_REGULATION_POOLS: string[] = [
    // Bordeaux Métropole
    `En tant que commune de Bordeaux Métropole, ${name} est directement impactée par la Zone à Faibles Émissions (ZFE) entrée en vigueur en 2025. Les véhicules Crit'Air 5 sont d'ores et déjà interdits de circulation, et le calendrier prévoit l'exclusion progressive des Crit'Air 4 puis 3. Installer une borne de recharge chez soi à ${name} est la meilleure anticipation face à ces restrictions croissantes.`,
    // Bassin d'Arcachon
    `Située sur le Bassin d'Arcachon, ${name} n'est pas encore soumise aux restrictions directes de la ZFE de Bordeaux Métropole, mais les trajets réguliers vers l'agglomération bordelaise sont concernés par les vignettes Crit'Air. De plus, la préservation de la qualité de l'air sur le littoral girondin encourage fortement l'adoption de véhicules propres et de bornes de recharge résidentielles.`,
    // Libournais / Médoc / Rural
    `Bien que ${name} se situe en dehors du périmètre strict de la ZFE de Bordeaux Métropole, les trajets vers l'agglomération bordelaise, fréquents pour les actifs du ${commune.intercommunalite || 'territoire'}, sont soumis aux réglementations Crit'Air. L'installation proactive d'une borne de recharge à domicile à ${name} permet d'anticiper l'évolution des restrictions environnementales et de profiter dès maintenant d'une mobilité décarbonée économique.`,
  ];
  let localRegulationIdx: number;
  if (zone === 'bordeaux-metropole') localRegulationIdx = 0;
  else if (zone === 'bassin-arcachon') localRegulationIdx = 1;
  else localRegulationIdx = 2;
  const localRegulation = LOCAL_REGULATION_POOLS[localRegulationIdx];

  // ---- DYNAMIC sourcesCitation (includes local intercommunalité) ----
  const sourcesCitation = `Sources : geo.api.gouv.fr, Ministère de la Transition Écologique, Banque des Territoires, Enedis Gironde${commune.intercommunalite ? `, données ${commune.intercommunalite}` : ''}`;

  return {
    introParagraph,
    logisticsAlert,
    useCaseText,
    pricesContext,
    faqItems,
    ecoText,
    localContext,
    climateZoneLabel,
    localAgencyName: agency.name,
    externalLinks: getExternalLinks(category, cp, slug),
    communeDataInsight,
    expertTip,
    tableIntro,
    guideLinks: getGuideLinks(category, slug),
    savingsEstimate,
    lastUpdated,
    realEstateInsight,
    populationTierContent,
    densiteAnalysis,
    marcheImmobilierInsight,
    distanceLyonContext: distanceBordeauxContext,
    localRegulation,
    sourcesCitation
  };
}
