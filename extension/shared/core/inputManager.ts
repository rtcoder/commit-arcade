import type {GameInput} from './gameTypes';

export interface InputManager {
  activate(usedKeys: ReadonlySet<string>, sink: (input: GameInput) => void): void;

  deactivate(): void;

  destroy(): void;
}

export function createInputManager(target: EventTarget = window): InputManager {
  let activeKeys: ReadonlySet<string> | null = null;
  let activeSink: ((input: GameInput) => void) | null = null;
  const abortController = new AbortController();

  const handleKeyDown = (event: Event): void => handleKeyboardEvent(event, 'down');
  const handleKeyUp = (event: Event): void => handleKeyboardEvent(event, 'up');

  target.addEventListener('keydown', handleKeyDown, {signal: abortController.signal});
  target.addEventListener('keyup', handleKeyUp, {signal: abortController.signal});

  return {
    activate(usedKeys, sink): void {
      activeKeys = usedKeys;
      activeSink = sink;
    },
    deactivate(): void {
      activeKeys = null;
      activeSink = null;
    },
    destroy(): void {
      abortController.abort();
      activeKeys = null;
      activeSink = null;
    },
  };

  function handleKeyboardEvent(event: Event, type: GameInput['type']): void {
    if (!(event instanceof KeyboardEvent) || activeKeys === null || activeSink === null || !activeKeys.has(event.key)) {
      return;
    }
    event.preventDefault();
    activeSink({key: event.key, type});
  }
}
