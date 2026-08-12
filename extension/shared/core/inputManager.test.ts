import {describe, expect, it} from 'vitest';

import {createInputManager} from './inputManager';

describe('createInputManager', () => {
  it('captures only active game keys and releases handlers on deactivate', () => {
    const target = new EventTarget();
    const inputs: string[] = [];
    const manager = createInputManager(target);

    manager.activate(new Set(['ArrowUp']), (input) => inputs.push(`${input.type}:${input.key}`));
    const used = new KeyboardEvent('keydown', {cancelable: true, key: 'ArrowUp'});
    const unused = new KeyboardEvent('keydown', {cancelable: true, key: 'x'});

    target.dispatchEvent(used);
    target.dispatchEvent(unused);
    manager.deactivate();
    target.dispatchEvent(new KeyboardEvent('keydown', {cancelable: true, key: 'ArrowUp'}));

    expect(inputs).toEqual(['down:ArrowUp']);
    expect(used.defaultPrevented).toBe(true);
    expect(unused.defaultPrevented).toBe(false);
  });
});
