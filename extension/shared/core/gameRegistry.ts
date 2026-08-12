import type {GameMetadata} from './gameTypes';

export const gameRegistry: readonly GameMetadata[] = [
  {
    id: 'runner',
    name: 'Commit Runner',
    description: 'A tiny endless runner across your contribution graph.',
    status: 'playable',
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Classic panoramic Snake inside the contribution grid.',
    status: 'playable',
  },
  {
    id: 'flappy',
    name: 'Flappy Commit',
    description: 'Flap through scrolling commit barriers.',
    status: 'playable',
  },
  {
    id: 'pong',
    name: 'Pong',
    description: 'One-player Pong against an imperfect AI paddle.',
    status: 'playable',
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Break top-row bricks with a quantized paddle and ball.',
    status: 'playable',
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'A compressed seven-row invader wave.',
    status: 'playable',
  },
  {
    id: 'tron',
    name: 'Tron',
    description: 'Light-cycle trails in a narrow contribution arena.',
    status: 'playable',
  },
  {
    id: 'frogger',
    name: 'Frogger',
    description: 'Seven contribution rows as traffic and safe lanes.',
    status: 'playable',
  },
  {
    id: 'helicopter',
    name: 'Helicopter',
    description: 'One-button flight through a scrolling tunnel.',
    status: 'playable',
  },
  {
    id: 'rhythm',
    name: 'Commit Beat',
    description: 'A minimal lane rhythm game for commit timelines.',
    status: 'playable',
  },
  {
    id: 'missile-command',
    name: 'Missile Command',
    description: 'Defend the contribution base from falling missiles.',
    status: 'playable',
  },
  {
    id: 'centipede',
    name: 'Centipede',
    description: 'Shoot a descending segmented bug before it reaches your row.',
    status: 'playable',
  },
];
