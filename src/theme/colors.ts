export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  water: string;
  waterSoft: string;
  overdue: string;
  overdueSoft: string;
  warn: string;
  warnSoft: string;
};

export const light: Palette = {
  bg: '#F4F1EA',
  surface: '#FFFFFF',
  surfaceAlt: '#EAE5D9',
  border: '#E2DCCF',
  text: '#1E2A22',
  textMuted: '#69736B',
  primary: '#2F6B47',
  primarySoft: '#DCEADF',
  onPrimary: '#FFFFFF',
  water: '#2E7DBA',
  waterSoft: '#DCEAF5',
  overdue: '#B9513A',
  overdueSoft: '#F5E0D9',
  warn: '#A8730F',
  warnSoft: '#F5E9CF',
};

export const dark: Palette = {
  bg: '#0F1411',
  surface: '#171E19',
  surfaceAlt: '#212923',
  border: '#29332C',
  text: '#ECEFEA',
  textMuted: '#98A39A',
  primary: '#86C79C',
  primarySoft: '#1E3426',
  onPrimary: '#0F1411',
  water: '#73B6E8',
  waterSoft: '#16283A',
  overdue: '#E98B72',
  overdueSoft: '#3A2119',
  warn: '#E5B65C',
  warnSoft: '#372B14',
};

/** Soft background tints for plant placeholders, picked from the plant id. */
export const leafTints = {
  light: ['#DCEADF', '#E7E3CC', '#D7E6E4', '#EADBD3', '#DDE2EE', '#E5DCE9'],
  dark: ['#1E3426', '#2D2B1C', '#1B2E2C', '#33241E', '#1F2433', '#2A2131'],
};
