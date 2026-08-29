import { logger } from '@endfieldmap/tools';
import { describe, expect, it, vi } from 'vitest';

import type { Command } from './command';
import { HistoryManager } from './history_manager';

function createCommand(description: string, handlers?: { execute?: () => void; undo?: () => void }): Command {
  return {
    description,
    execute: handlers?.execute || vi.fn(),
    undo: handlers?.undo || vi.fn(),
  };
}

describe('HistoryManager', () => {
  it('executes commands, records history, and supports undo/redo', () => {
    const manager = new HistoryManager();
    const execute = vi.fn();
    const undo = vi.fn();
    const command = createCommand('cmd-1', { execute, undo });

    manager.execute(command);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
    expect(manager.undoCount).toBe(1);
    expect(manager.getUndoDescriptions()).toEqual(['cmd-1']);

    expect(manager.undo()).toBe(true);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);
    expect(manager.getRedoDescriptions()).toEqual(['cmd-1']);

    expect(manager.redo()).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  it('clears the redo stack when a new command is executed after undo', () => {
    const manager = new HistoryManager();
    const first = createCommand('first');
    const second = createCommand('second');

    manager.execute(first);
    manager.undo();
    expect(manager.canRedo).toBe(true);

    manager.execute(second);

    expect(manager.canRedo).toBe(false);
    expect(manager.getUndoDescriptions()).toEqual(['second']);
  });

  it('keeps only the latest commands up to maxHistory', () => {
    const manager = new HistoryManager(2);

    manager.execute(createCommand('one'));
    manager.execute(createCommand('two'));
    manager.execute(createCommand('three'));

    expect(manager.undoCount).toBe(2);
    expect(manager.getUndoDescriptions()).toEqual(['three', 'two']);
  });

  it('returns false when undo or redo is unavailable', () => {
    const debug = vi.spyOn(logger, 'debug').mockImplementation(() => logger);
    const manager = new HistoryManager();

    expect(manager.undo()).toBe(false);
    expect(manager.redo()).toBe(false);
    expect(debug).toHaveBeenCalled();
  });

  it('rethrows execute errors and keeps history unchanged', () => {
    const error = new Error('execute failed');
    const manager = new HistoryManager();
    const logError = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const command = createCommand('bad', {
      execute: () => {
        throw error;
      },
    });

    expect(() => manager.execute(command)).toThrow(error);
    expect(manager.undoCount).toBe(0);
    expect(logError).toHaveBeenCalled();
  });

  it('returns false when undo or redo handlers throw', () => {
    const manager = new HistoryManager();
    const logError = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const command = createCommand('bad-undo', {
      undo: () => {
        throw new Error('undo failed');
      },
    });

    manager.execute(command);
    expect(manager.undo()).toBe(false);
    expect(logError).toHaveBeenCalled();

    const redoManager = new HistoryManager();
    const redoCommand = createCommand('bad-redo', {
      execute: vi
        .fn()
        .mockImplementationOnce(() => undefined)
        .mockImplementationOnce(() => {
          throw new Error('redo failed');
        }),
    });

    redoManager.execute(redoCommand);
    redoManager.undo();
    expect(redoManager.redo()).toBe(false);
    expect(logError).toHaveBeenCalled();
  });

  it('clears all history', () => {
    const manager = new HistoryManager();

    manager.execute(createCommand('one'));
    manager.execute(createCommand('two'));
    manager.clear();

    expect(manager.undoCount).toBe(0);
    expect(manager.redoCount).toBe(0);
    expect(manager.getUndoDescriptions()).toEqual([]);
    expect(manager.getRedoDescriptions()).toEqual([]);
  });
});
