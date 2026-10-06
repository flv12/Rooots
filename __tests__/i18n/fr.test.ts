import { fr } from '@/i18n/fr';

describe('fr.status', () => {
  it.each([
    [{ kind: 'overdue', days: -1 }, 'En retard d’1 jour'],
    [{ kind: 'overdue', days: -3 }, 'En retard de 3 jours'],
    [{ kind: 'today', days: 0 }, 'Aujourd’hui'],
    [{ kind: 'upcoming', days: 1 }, 'Demain'],
    [{ kind: 'upcoming', days: 4 }, 'Dans 4 jours'],
  ] as const)('labels %j as %s', (status, label) => {
    expect(fr.status(status)).toBe(label);
  });
});

describe('fr.everyDays', () => {
  it('handles singular and plural', () => {
    expect(fr.everyDays(1)).toBe('Tous les jours');
    expect(fr.everyDays(7)).toBe('Tous les 7 jours');
  });
});

describe('fr.toWaterCount', () => {
  it('summarises the number of plants to water', () => {
    expect(fr.toWaterCount(0)).toBe('Rien à arroser aujourd’hui');
    expect(fr.toWaterCount(1)).toBe('1 plante à arroser');
    expect(fr.toWaterCount(3)).toBe('3 plantes à arroser');
  });
});

describe('fr.reminder', () => {
  it('titles the recap with the plant count', () => {
    expect(fr.reminder.recapTitle(1)).toBe('💧 1 plante à arroser');
    expect(fr.reminder.recapTitle(3)).toBe('💧 3 plantes à arroser');
  });

  it('lists up to 4 names then summarises the rest', () => {
    expect(fr.reminder.recapBody(['A', 'B'])).toBe('A et B');
    expect(fr.reminder.recapBody(['A', 'B', 'C'])).toBe('A, B et C');
    expect(fr.reminder.recapBody(['A', 'B', 'C', 'D', 'E', 'F'])).toBe('A, B, C, D et 2 autres');
  });
});
