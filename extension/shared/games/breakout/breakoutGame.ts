import {type BoardCoordinate, type BoardSize, createEmptyFrame} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface BreakoutOptions {
  brickRows?: number;
  initialBall?: BoardCoordinate;
  initialBallVelocity?: BoardCoordinate;
  initialPaddleColumn?: number;
}

const PADDLE_WIDTH = 3;
const BALL_SPEED_ROWS_PER_SECOND = -5;
const BALL_SPEED_COLUMNS_PER_SECOND = 3;
const PADDLE_SPEED_COLUMNS_PER_SECOND = 12;

export function createBreakoutGame(options: BreakoutOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let paddleColumn = 0;
  let paddleDirection = 0;
  let ball: BoardCoordinate = {row: 0, column: 0};
  let velocity: BoardCoordinate = {row: 0, column: 0};
  let bricks = new Set<string>();
  let score = 0;
  let stopped = false;

  return {
    id: 'breakout',
    name: 'Breakout',
    description: 'Break top-row bricks with a quantized paddle and ball.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      paddleColumn = clamp(options.initialPaddleColumn ?? centeredPaddleColumn(), 0, maxPaddleColumn());
      paddleDirection = 0;
      ball = options.initialBall !== undefined ? {...options.initialBall} : {
        row: paddleRow() - 1,
        column: paddleColumn + 1,
      };
      velocity = options.initialBallVelocity !== undefined ? {...options.initialBallVelocity} : {
        row: BALL_SPEED_ROWS_PER_SECOND,
        column: BALL_SPEED_COLUMNS_PER_SECOND,
      };
      bricks = initialBricks();
      score = 0;
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const seconds = Math.max(0, deltaMs) / 1000;
      paddleColumn = clamp(paddleColumn + paddleDirection * PADDLE_SPEED_COLUMNS_PER_SECOND * seconds, 0, maxPaddleColumn());
      moveBall(seconds);
    },
    handleInput(input: GameInput): void {
      if (input.key !== 'ArrowLeft' && input.key !== 'ArrowRight' && input.key !== 'a' && input.key !== 'A' && input.key !== 'd' && input.key !== 'D') {
        return;
      }
      if (input.type === 'up') {
        paddleDirection = 0;
        return;
      }
      paddleDirection = input.key === 'ArrowLeft' || input.key === 'a' || input.key === 'A' ? -1 : 1;
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const brick of bricks) {
        const [row, column] = brick.split(':').map(Number);
        if (row !== undefined && column !== undefined && Number.isFinite(row) && Number.isFinite(column)) {
          frame[row]![column] = 'obstacle';
        }
      }
      for (let offset = 0; offset < Math.min(PADDLE_WIDTH, size.columns); offset += 1) {
        frame[paddleRow()]![Math.round(paddleColumn) + offset] = 'player';
      }
      frame[clamp(Math.round(ball.row), 0, size.rows - 1)]![clamp(Math.round(ball.column), 0, size.columns - 1)] = 'bonus';
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function moveBall(seconds: number): void {
    ball = {row: ball.row + velocity.row * seconds, column: ball.column + velocity.column * seconds};
    if (ball.column < 0) {
      ball.column = 0;
      velocity.column = Math.abs(velocity.column);
    }
    if (ball.column > size.columns - 1) {
      ball.column = size.columns - 1;
      velocity.column = -Math.abs(velocity.column);
    }
    if (ball.row < 0) {
      ball.row = 0;
      velocity.row = Math.abs(velocity.row);
    }
    const renderedBall = {
      row: clamp(Math.round(ball.row), 0, size.rows - 1),
      column: clamp(Math.round(ball.column), 0, size.columns - 1),
    };
    const brickKey = coordinateKey(renderedBall);
    if (bricks.delete(brickKey)) {
      score += 1;
      context?.onScore?.(score);
      velocity.row = Math.abs(velocity.row);
      if (bricks.size === 0) {
        refillBricks();
      }
    }
    if (ball.row >= paddleRow() - 0.25 && velocity.row > 0) {
      if (isOnPaddle(ball.column)) {
        ball.row = paddleRow() - 1;
        velocity.row = -Math.abs(velocity.row);
        velocity.column += (ball.column - (paddleColumn + (PADDLE_WIDTH - 1) / 2)) * 0.8;
      } else if (ball.row > paddleRow()) {
        stopped = true;
        context?.onGameOver?.();
      }
    }
  }

  function initialBricks(): Set<string> {
    const result = new Set<string>();
    for (let row = 0; row < brickRows(); row += 1) {
      for (let column = 0; column < size.columns; column += 1) {
        result.add(coordinateKey({row, column}));
      }
    }
    return result;
  }

  function refillBricks(): void {
    bricks = initialBricks();
  }

  function brickRows(): number {
    return clamp(options.brickRows ?? Math.min(2, Math.max(1, size.rows - 4)), 1, Math.max(1, size.rows - 2));
  }

  function isOnPaddle(column: number): boolean {
    return column >= Math.round(paddleColumn) && column <= Math.round(paddleColumn) + PADDLE_WIDTH - 1;
  }

  function paddleRow(): number {
    return Math.max(0, size.rows - 1);
  }

  function centeredPaddleColumn(): number {
    return Math.floor((size.columns - Math.min(PADDLE_WIDTH, size.columns)) / 2);
  }

  function maxPaddleColumn(): number {
    return Math.max(0, size.columns - Math.min(PADDLE_WIDTH, size.columns));
  }
}

function coordinateKey(coordinate: BoardCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
