import { Engine, Task } from "grimoire-kolmafia";
import { print } from "kolmafia";
import { HIGHLIGHT, safeInterrupt } from "../lib";

/** A base engine for Garbo!
 * Runs extra logic before executing all tasks.
 */
export class BaseGarboEngine extends Engine {
  // Check for interrupt before executing a task
  execute(task: Task): void {
    safeInterrupt();
    super.execute(task);
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
export class SafeGarboEngine extends BaseGarboEngine {
  // Garbo treats soft limits as completed, and continues on.
  markAttempt(task: Task<never>): void {
    super.markAttempt(task);

    if (task.completed()) return;
    const limit = task.limit?.soft || 1;
    if (this.attempts[task.name] >= limit) {
      task.completed = () => true;
      print(`Task ${task.name} did not complete within ${limit} attempts. Skipping.`, HIGHLIGHT);
    }
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
