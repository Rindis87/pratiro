import { ArenaConfig, ArenaId } from '../types';
import { familieArena } from './familie';
import { arbeidslivArena } from './arbeidsliv';
import { jobbintervjuArena } from './jobbintervju';
import { eksamenArena } from './eksamen';

export const arenas: Record<ArenaId, ArenaConfig> = {
  familie: familieArena,
  arbeidsliv: arbeidslivArena,
  jobbintervju: jobbintervjuArena,
  eksamen: eksamenArena,
};

export const arenaList: ArenaConfig[] = [
  familieArena,
  arbeidslivArena,
  jobbintervjuArena,
  eksamenArena,
];

export function getArena(id: ArenaId): ArenaConfig {
  return arenas[id] || familieArena;
}

export function isValidArenaId(id: string): id is ArenaId {
  return id in arenas;
}

export { familieArena, arbeidslivArena, jobbintervjuArena, eksamenArena };
