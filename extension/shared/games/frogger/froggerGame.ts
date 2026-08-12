import {type BoardCoordinate, type BoardSize, createEmptyFrame} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface TrafficCar extends BoardCoordinate {
  direction: -1 | 1;
}

interface FroggerOptions {
  initialCars?: TrafficCar[];
  initialPlayer?: BoardCoordinate;
  trafficStepMs?: number;
}

const DEFAULT_TRAFFIC_STEP_MS = 320;

export function createFroggerGame(options: FroggerOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let player: BoardCoordinate = {row: 0, column: 0};
  let cars: TrafficCar[] = [];
  let trafficElapsedMs = 0;
  let score = 0;
  let stopped = false;

  return {
    id: 'frogger',
    name: 'Frogger',
    description: 'Seven contribution rows as traffic and safe lanes.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      player = options.initialPlayer !== undefined ? {...options.initialPlayer} : startPosition();
      cars = options.initialCars?.map((car) => ({...car})) ?? createDefaultCars();
      trafficElapsedMs = 0;
      score = 0;
      stopped = false;
      checkCollision();
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      trafficElapsedMs += Math.max(0, deltaMs);
      const stepMs = Math.max(1, options.trafficStepMs ?? DEFAULT_TRAFFIC_STEP_MS);
      while (trafficElapsedMs >= stepMs && !stopped) {
        trafficElapsedMs -= stepMs;
        cars = cars.map((car) => ({...car, column: wrapColumn(car.column + car.direction)}));
        checkCollision();
      }
    },
    handleInput(input: GameInput): void {
      if (stopped || input.type !== 'down') {
        return;
      }
      const next = nextPlayer(input.key);
      if (next === null) {
        return;
      }
      player = next;
      if (player.row === 0) {
        score += 1;
        context?.onScore?.(score);
        player = startPosition();
        return;
      }
      checkCollision();
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const car of cars) {
        if (isInBounds(car)) {
          frame[car.row]![car.column] = 'obstacle';
        }
      }
      frame[player.row]![player.column] = 'player';
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function nextPlayer(key: string): BoardCoordinate | null {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        return {row: clamp(player.row - 1, 0, size.rows - 1), column: player.column};
      case 'ArrowDown':
      case 's':
      case 'S':
        return {row: clamp(player.row + 1, 0, size.rows - 1), column: player.column};
      case 'ArrowLeft':
      case 'a':
      case 'A':
        return {row: player.row, column: clamp(player.column - 1, 0, size.columns - 1)};
      case 'ArrowRight':
      case 'd':
      case 'D':
        return {row: player.row, column: clamp(player.column + 1, 0, size.columns - 1)};
      default:
        return null;
    }
  }

  function checkCollision(): void {
    if (cars.some((car) => car.row === player.row && car.column === player.column)) {
      stopped = true;
      context?.onGameOver?.();
    }
  }

  function createDefaultCars(): TrafficCar[] {
    const result: TrafficCar[] = [];
    for (let row = 1; row < size.rows - 1; row += 1) {
      const direction: -1 | 1 = row % 2 === 0 ? -1 : 1;
      const spacing = row % 2 === 0 ? 5 : 4;
      for (let column = row % spacing; column < size.columns; column += spacing) {
        result.push({row, column, direction});
      }
    }
    return result;
  }

  function startPosition(): BoardCoordinate {
    return {row: Math.max(0, size.rows - 1), column: Math.floor(size.columns / 2)};
  }

  function wrapColumn(column: number): number {
    return ((column % size.columns) + size.columns) % size.columns;
  }

  function isInBounds(coordinate: BoardCoordinate): boolean {
    return coordinate.row >= 0 && coordinate.row < size.rows && coordinate.column >= 0 && coordinate.column < size.columns;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
