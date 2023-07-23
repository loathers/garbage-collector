import { Engine, Task } from "grimoire-kolmafia";
import { print } from "kolmafia";
import { HIGHLIGHT, safeInterrupt } from "../lib";

/** A base engine for Garbo!
 * Runs extra logic before executing all tasks.
 */
export class BaseGarboEngine<T extends Task = Task> extends Engine<never, T> {
  // Check for interrupt before executing a task
  execute(task: T): void {
    safeInterrupt();
    super.execute(task);
  }
}

export type SafeGarboTask = Task & { tryLimit?: number };

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
export class SafeGarboEngine<T extends SafeGarboTask = SafeGarboTask> extends BaseGarboEngine<T> {
  available(task: T): boolean {
    return super.available(task) && !(task.tryLimit && this.attempts[task.name] >= task.tryLimit);
  }
}

export function runSafeGarboTasks(tasks: Task[]): void {
  const engine = new SafeGarboEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}

export function runGarboTasks(tasks: Task[]): void {
  const engine = new BaseGarboEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}
