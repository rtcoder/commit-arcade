import { createEmptyFrame, type BoardCoordinate, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface PongOptions {
  initialAiRow?: number;
  initialBall?: BoardCoordinate;
  initialBallVelocity?: BoardCoordinate;
  initialPlayerRow?: number;
}

const PADDLE_SIZE = 3;
const PLAYER_COLUMN = 0;
const BALL_SPEED_COLUMNS_PER_SECOND = 8;
const AI_SPEED_ROWS_PER_SECOND = 5;
const PLAYER_SPEED_ROWS_PER_SECOND = 10;

export function createPongGame(options: PongOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let playerRow = 0;
  let aiRow = 0;
  let ball: BoardCoordinate = { row: 0, column: 0 };
  let velocity: BoardCoordinate = { row: 0, column: 0 };
  let playerDirection = 0;
  let score = 0;
  let stopped = false;

  return {
    id: 'pong',
    name: 'Pong',
    description: 'One-player Pong against an imperfect AI paddle.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      playerRow = clamp(options.initialPlayerRow ?? centeredPaddleTop(), 0, maxPaddleTop());
      aiRow = clamp(options.initialAiRow ?? centeredPaddleTop(), 0, maxPaddleTop());
      ball = options.initialBall !== undefined ? { ...options.initialBall } : { row: Math.floor(size.rows / 2), column: Math.floor(size.columns / 2) };
      velocity = options.initialBallVelocity !== undefined ? { ...options.initialBallVelocity } : { row: 2, column: BALL_SPEED_COLUMNS_PER_SECOND };
      playerDirection = 0;
      score = 0;
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const seconds = Math.max(0, deltaMs) / 1000;
      playerRow = clamp(playerRow + playerDirection * PLAYER_SPEED_ROWS_PER_SECOND * seconds, 0, maxPaddleTop());
      updateAi(seconds);
      moveBall(seconds);
    },
    handleInput(input: GameInput): void {
      if (input.key !== 'ArrowUp' && input.key !== 'ArrowDown' && input.key !== 'w' && input.key !== 'W' && input.key !== 's' && input.key !== 'S') {
        return;
      }
      if (input.type === 'up') {
        playerDirection = 0;
        return;
      }
      playerDirection = input.key === 'ArrowUp' || input.key === 'w' || input.key === 'W' ? -1 : 1;
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      drawPaddle(frame, PLAYER_COLUMN, Math.round(playerRow), 'player');
      drawPaddle(frame, aiColumn(), Math.round(aiRow), 'enemy');
      const ballRow = clamp(Math.round(ball.row), 0, size.rows - 1);
      const ballColumn = clamp(Math.round(ball.column), 0, size.columns - 1);
      frame[ballRow]![ballColumn] = 'bonus';
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function moveBall(seconds: number): void {
    ball = { row: ball.row + velocity.row * seconds, column: ball.column + velocity.column * seconds };
    if (ball.row < 0) {
      ball.row = 0;
      velocity.row = Math.abs(velocity.row);
    }
    if (ball.row > size.rows - 1) {
      ball.row = size.rows - 1;
      velocity.row = -Math.abs(velocity.row);
    }
    if (ball.column <= PLAYER_COLUMN && velocity.column < 0) {
      if (isWithinPaddle(ball.row, playerRow)) {
        ball.column = PLAYER_COLUMN + 1;
        velocity.column = Math.abs(velocity.column);
        velocity.row += paddleDeflection(ball.row, playerRow);
      } else {
        stopped = true;
        context?.onGameOver?.();
      }
    }
    if (ball.column >= aiColumn() && velocity.column > 0) {
      if (isWithinPaddle(ball.row, aiRow)) {
        ball.column = aiColumn() - 1;
        velocity.column = -Math.abs(velocity.column);
        velocity.row += paddleDeflection(ball.row, aiRow);
      } else {
        score += 1;
        context?.onScore?.(score);
        resetBallTowardPlayer();
      }
    }
  }

  function updateAi(seconds: number): void {
    const target = ball.row - Math.floor(PADDLE_SIZE / 2);
    const delta = clamp(target - aiRow, -AI_SPEED_ROWS_PER_SECOND * seconds, AI_SPEED_ROWS_PER_SECOND * seconds);
    aiRow = clamp(aiRow + delta, 0, maxPaddleTop());
  }

  function resetBallTowardPlayer(): void {
    ball = { row: Math.floor(size.rows / 2), column: aiColumn() - 1 };
    velocity = { row: 1, column: -BALL_SPEED_COLUMNS_PER_SECOND };
  }

  function drawPaddle(frame: ReturnType<typeof createEmptyFrame>, column: number, top: number, state: 'enemy' | 'player'): void {
    for (let offset = 0; offset < Math.min(PADDLE_SIZE, size.rows); offset += 1) {
      frame[clamp(top + offset, 0, size.rows - 1)]![column] = state;
    }
  }

  function aiColumn(): number {
    return Math.max(0, size.columns - 1);
  }

  function centeredPaddleTop(): number {
    return Math.floor((size.rows - Math.min(PADDLE_SIZE, size.rows)) / 2);
  }

  function maxPaddleTop(): number {
    return Math.max(0, size.rows - Math.min(PADDLE_SIZE, size.rows));
  }
}

function isWithinPaddle(row: number, paddleTop: number): boolean {
  return row >= Math.floor(paddleTop) && row <= Math.floor(paddleTop) + PADDLE_SIZE - 1;
}

function paddleDeflection(ballRow: number, paddleTop: number): number {
  return (ballRow - (paddleTop + (PADDLE_SIZE - 1) / 2)) * 1.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
