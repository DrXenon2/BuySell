/**
 * Configuration des pays et régions
 */

export const COUNTRIES = [
  {
    code: 'FR',
    name: 'France',
    phoneCode: '+33',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    locale: 'fr-FR',
    regions: [
      'Auvergne-Rhône-Alpes',
      'Bourgogne-Franche-Comté',
      'Bretagne',
      'Centre-Val de Loire',
      'Corse',
      'Grand Est',
      'Hauts-de-France',
      'Île-de-France',
      'Normandie',
      'Nouvelle-Aquitaine',
      'Occitanie',
      'Pays de la Loire',
      'Provence-Alpes-Côte d\'Azur',
    ],
  },
  {
    code: 'BE',
    name: 'Belgique',
    phoneCode: '+32',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
    locale: 'fr-BE',
    regions: [
      'Bruxelles-Capitale',
      'Région flamande',
      'Région wallonne',
    ],
  },
  {
    code: 'CH',
    name: 'Suisse',
    phoneCode: '+41',
    currency: 'CHF',
    timezone: 'Europe/Zurich',
    locale: 'fr-CH',
    regions: [
      'Zurich',
      'Berne',
      'Lucerne',
      'Uri',
      'Schwyz',
      'Obwald',
      'Nidwald',
      'Glaris',
      'Zoug',
      'Fribourg',
      'Soleure',
      'Bâle-Ville',
      'Bâle-Campagne',
      'Schaffhouse',
      'Appenzell Rhodes-Extérieures',
      'Appenzell Rhodes-Intérieures',
      'Saint-Gall',
      'Grisons',
      'Argovie',
      'Thurgovie',
      'Tessin',
      'Vaud',
      'Valais',
      'Neuchâtel',
      'Genève',
      'Jura',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    phoneCode: '+1',
    currency: 'CAD',
    timezone: 'America/Toronto',
    locale: 'fr-CA',
    regions: [
      'Alberta',
      'Colombie-Britannique',
      'Île-du-Prince-Édouard',
      'Manitoba',
      'Nouveau-Brunswick',
      'Nouvelle-Écosse',
      'Nunavut',
      'Ontario',
      'Québec',
      'Saskatchewan',
      'Terre-Neuve-et-Labrador',
      'Territoires du Nord-Ouest',
      'Yukon',
    ],
  },
  {
    code: 'SN',
    name: 'Sénégal',
    phoneCode: '+221',
    currency: 'XOF',
    timezone: 'Africa/Dakar',
    locale: 'fr-SN',
    regions: [
      'Dakar',
      'Diourbel',
      'Fatick',
      'Kaffrine',
      'Kaolack',
      'Kédougou',
      'Kolda',
      'Louga',
      'Matam',
      'Saint-Louis',
      'Sédhiou',
      'Tambacounda',
      'Thiès',
      'Ziguinchor',
    ],
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    phoneCode: '+225',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    locale: 'fr-CI',
    regions: [
      'Abidjan',
      'Bas-Sassandra',
      'Comoé',
      'Denguélé',
      'Gôh-Djiboua',
      'Lacs',
      'Lagunes',
      'Montagnes',
      'Sassandra-Marahoué',
      'Savanes',
      'Vallée du Bandama',
      'Woroba',
      'Yamoussoukro',
      'Zanzan',
    ],
  },
];

// Formats d'adresse par pays
export const ADDRESS_FORMATS = {
  FR: {
    template: [
      { field: 'street', required: true },
      { field: 'complement', required: false },
      { field: 'postalCode', required: true },
      { field: 'city', required: true },
      { field: 'country', required: true },
    ],
    postalCodePattern: /^\d{5}$/,
    validation: {
      postalCode: (value) => /^\d{5}$/.test(value),
    },
  },
  US: {
    template: [
      { field: 'street', required: true },
      { field: 'city', required: true },
      { field: 'state', required: true },
      { field: 'postalCode', required: true },
      { field: 'country', required: true },
    ],
    postalCodePattern: /^\d{5}(-\d{4})?$/,
  },
  CA: {
    template: [
      { field: 'street', required: true },
      { field: 'city', required: true },
      { field: 'province', required: true },
      { field: 'postalCode', required: true },
      { field: 'country', required: true },
    ],
    postalCodePattern: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
  },
};

// Récupérer un pays par son code
export const getCountryByCode = (code) => {
  return COUNTRIES.find(country => country.code === code) || COUNTRIES[0];
};

// Récupérer tous les codes de pays
export const getCountryCodes = () => {
  return COUNTRIES.map(country => country.code);
};

// Récupérer les régions d'un pays
export const getRegionsByCountry = (countryCode) => {
  const country = getCountryByCode(countryCode);
  return country ? country.regions : [];
};

export default COUNTRIES;
