import type { Category, Level, Light } from '@/catalog/schema';
import type { GreetingPhrases } from '@/domain/greeting';
import type { CareType } from '@/domain/types';
import type { WateringStatus } from '@/domain/watering';

const plural = (n: number, one: string, many: string) => (Math.abs(n) === 1 ? one : many);

export const fr = {
  appName: 'Rooots',
  tabs: { home: 'Mes plantes', catalog: 'Catalogue', settings: 'Réglages' },

  status: (s: WateringStatus): string => {
    if (s.kind === 'today') return 'Aujourd’hui';
    if (s.kind === 'overdue') {
      const n = -s.days;
      return n === 1 ? 'En retard d’1 jour' : `En retard de ${n} jours`;
    }
    return s.days === 1 ? 'Demain' : `Dans ${s.days} jours`;
  },
  everyDays: (n: number) => (n === 1 ? 'Tous les jours' : `Tous les ${n} jours`),
  toWaterCount: (n: number) =>
    n === 0 ? 'Rien à arroser aujourd’hui' : `${n} ${plural(n, 'plante', 'plantes')} à arroser`,
  plantCount: (n: number) => `${n} ${plural(n, 'plante', 'plantes')}`,
  daysShort: (n: number) => `${n} j`,

  home: {
    greetings: {
      morning: [
        'Bonjour, main verte',
        'Bonjour la jungle',
        'Debout, les pousses',
        'Café et chlorophylle',
        'Un matin tout vert',
        'Les feuilles s’éveillent',
      ],
      afternoon: [
        'Bon après-midi',
        'Belle journée au jardin',
        'Coucou, main verte',
        'Grand soleil au salon',
        'Tout pousse bien ?',
        'Une pause verte ?',
      ],
      evening: [
        'Bonsoir les feuilles',
        'Bonsoir, main verte',
        'Douce soirée au vert',
        'Bonne soirée la jungle',
        'Les plantes se reposent',
        'Petit tour du soir ?',
      ],
      night: [
        'Encore debout ?',
        'Les plantes dorment',
        'Chut, ça pousse',
        'Bonne nuit la jungle',
        'Nuit calme au jardin',
        'Une petite insomnie ?',
      ],
      allWatered: ['Jungle bien hydratée', 'Tout pousse en paix', 'Rien à faire, profitez'],
      overdue: ['Quelqu’un a soif', 'La jungle a soif', 'Petit tour d’arrosoir ?'],
    } satisfies GreetingPhrases,
    toWater: 'À arroser',
    upcoming: 'Prochainement',
    allGood: 'Tout le monde a bu',
    allGoodHint: 'Prochain arrosage',
    emptyTitle: 'Aucune plante pour l’instant',
    emptyHint: 'Ajoutez votre première plante depuis le catalogue.',
    emptyCta: 'Parcourir le catalogue',
    water: 'Arroser',
    watered: (name: string) => `${name} est arrosée 💧`,
    undo: 'Annuler',
  },

  catalog: {
    title: 'Catalogue',
    subtitle: 'Plantes d’intérieur courantes',
    searchPlaceholder: 'Monstera, pothos, Ficus…',
    noResults: 'Aucune plante ne correspond',
    noResultsHint: 'Essayez un autre nom, en français, en anglais ou en latin.',
    addManual: 'Ajouter une plante hors catalogue',
    backToTop: 'Revenir en haut du catalogue',
    filters: { easy: 'Facile', lowLight: 'Peu de lumière', petSafe: 'Sans danger animaux' },
    add: 'Ajouter à mes plantes',
    draft: 'Fiche brouillon, pas encore relue',
    sections: {
      watering: 'Arrosage',
      care: 'Entretien',
      tips: 'Conseil',
      problems: 'Problèmes fréquents',
      pets: 'Animaux',
      sources: 'Sources',
    },
    summer: 'Été',
    winter: 'Hiver',
    soil: 'Terreau',
    fertilize: 'Engrais',
    repot: (years: number) => `Rempotage tous les ${years} ${plural(years, 'an', 'ans')}`,
    temperature: (min: number, max: number) => `${min} à ${max} °C`,
    petDisclaimer: 'Indicatif. En cas de doute, contactez un vétérinaire.',
  },

  light: {
    low: 'Peu de lumière',
    medium: 'Lumière moyenne',
    bright_indirect: 'Lumière vive indirecte',
    direct: 'Soleil direct',
  } satisfies Record<Light, string>,
  humidity: {
    low: 'Air sec toléré',
    medium: 'Humidité moyenne',
    high: 'Aime l’humidité',
  } satisfies Record<Level, string>,
  difficulty: { easy: 'Facile', medium: 'Intermédiaire', hard: 'Exigeante' },
  category: {
    foliage: 'Feuillage',
    succulent: 'Succulentes et cactus',
    flowering: 'Fleuries',
    palm: 'Palmiers',
    fern: 'Fougères',
    carnivorous: 'Carnivores',
    edible: 'Comestibles',
  } satisfies Record<Category, string>,
  allCategories: 'Toutes',
  synonymsLabel: (names: string[]) => `Anciennement ${names.join(', ')}`,
  petToxic: {
    yes: 'Toxique pour les animaux',
    no: 'Sans danger pour les animaux',
    unknown: 'Toxicité inconnue',
  },

  care: {
    water: 'Arrosage',
    fertilize: 'Engrais',
    repot: 'Rempotage',
    prune: 'Taille',
    other: 'Autre',
  } satisfies Record<CareType, string>,

  plant: {
    nextWatering: 'Prochain arrosage',
    lastWatered: 'Dernier arrosage',
    never: 'Jamais',
    frequency: 'Fréquence',
    frequencySource: {
      override: 'Réglée par vous',
      catalog: 'Selon la saison (catalogue)',
      fallback: 'Valeur par défaut',
    },
    location: 'Emplacement',
    history: 'Historique',
    noHistory: 'Aucun soin noté pour l’instant.',
    logHint: 'Touchez pour supprimer',
    when: {
      question: 'Quand ?',
      today: 'Aujourd’hui',
      yesterday: 'Hier',
      pick: 'Choisir une date…',
    },
    careSaved: (care: string, day: string) => `${care} noté pour ${day}`,
    deleteLog: 'Supprimer de l’historique',
    logDeleted: (care: string) => `${care} supprimé de l’historique`,
    fromCatalog: 'Fiche du catalogue',
    waterNow: 'J’ai arrosé',
    logCare: 'Noter un soin',
    edit: 'Modifier',
    archive: 'Archiver',
    archiveConfirmTitle: 'Archiver cette plante ?',
    archiveConfirmBody: 'Elle disparaîtra de votre liste et de vos rappels.',
    cancel: 'Annuler',
    notFound: 'Plante introuvable',
  },

  form: {
    newTitle: 'Nouvelle plante',
    editTitle: 'Modifier',
    name: 'Surnom (facultatif)',
    nameHint: (fallback: string) => `Laissez vide pour l’appeler « ${fallback} ».`,
    namePlaceholder: 'Ex. Monique la monstera',
    species: 'Espèce',
    speciesPlaceholder: 'Ex. Ficus benjamina',
    location: 'Emplacement',
    locations: ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Bureau', 'Entrée'],
    photo: 'Photo',
    addPhoto: 'Ajouter une photo',
    changePhoto: 'Changer',
    takePhoto: 'Prendre une photo',
    fromLibrary: 'Depuis la galerie',
    frequency: 'Arrosage',
    frequencyHint: (summer: number, winter: number) =>
      `Catalogue : tous les ${summer} j en été, ${winter} j en hiver.`,
    useSeason: 'Suivre les saisons',
    custom: 'Fréquence fixe',
    notes: 'Notes',
    notesPlaceholder: 'Rempotée en mars, cadeau de…',
    save: 'Enregistrer',
    add: 'Ajouter',
  },

  settings: {
    title: 'Réglages',
    reminders: 'Rappels',
    remindersOn: 'Rappels d’arrosage',
    remindersHint: 'Un récapitulatif chaque matin des plantes à arroser.',
    time: 'Heure du rappel',
    data: 'Données',
    clearAll: 'Tout effacer',
    clearAllHint: 'Supprime toutes vos plantes, leur historique et leurs photos.',
    clearAllConfirm: 'Cette action est définitive.',
    about: 'À propos',
    credits: 'Crédits et sources',
    version: 'Version',
  },

  credits: {
    title: 'Crédits',
    intro:
      'Les fiches du catalogue sont des brouillons en cours de relecture. Les photos proviennent de Wikimedia Commons sous licence libre.',
    photos: 'Photos',
    noPhotos: 'Pas encore de photos embarquées.',
    data: 'Données',
  },

  reminder: {
    recapTitle: (n: number) => `💧 ${n} ${plural(n, 'plante', 'plantes')} à arroser`,
    recapBody: (names: string[]) => {
      const shown = names.slice(0, 4);
      const rest = names.length - shown.length;
      if (rest > 0) return `${shown.join(', ')} et ${rest} ${plural(rest, 'autre', 'autres')}`;
      if (shown.length === 1) return shown[0];
      return `${shown.slice(0, -1).join(', ')} et ${shown.at(-1)}`;
    },
    staleTitle: 'Vos plantes vous attendent 🌿',
    staleBody: 'Ouvrez l’application pour continuer à recevoir les rappels.',
  },

  common: { back: 'Retour', close: 'Fermer', days: 'jours' },
};
