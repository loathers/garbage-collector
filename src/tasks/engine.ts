import { Engine, Task } from "grimoire-kolmafia";
import { Location } from "kolmafia";
import { safeInterrupt } from "../lib";

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
  /**
   * Check if the task has passed any of its internal limits.
   * @param task The task to check.
   * @throws An error if any of the internal limits have been passed.
   */
  checkLimits(task: Task, postcondition: (() => boolean) | undefined): void {
    if (!task.limit) return;
    const failureMessage = task.limit.message ? ` ${task.limit.message}` : "";
    if (!task.completed()) {
      if (task.limit.tries && this.attempts[task.name] >= task.limit.tries) {
        throw `Task ${task.name} did not complete within ${task.limit.tries} attempts. Please check what went wrong.${failureMessage}`;
      }
      if (
        task.limit.turns &&
        task.do instanceof Location &&
        task.do.turnsSpent >= task.limit.turns
      ) {
        throw `Task ${task.name} did not complete within ${task.limit.turns} turns. Please check what went wrong.${failureMessage}`;
      }
      // Removed handling of soft limits
      if (task.limit.unready && task.ready?.()) {
        throw `Task ${task.name} is still ready, but it should not be. Please check what went wrong.${failureMessage}`;
      }
      if (task.limit.completed) {
        throw `Task ${task.name} is not completed, but it should be. Please check what went wrong.${failureMessage}`;
      }
    }
    if (postcondition && !postcondition()) {
      throw `Task ${task.name} failed its guard. Please check what went wrong.${failureMessage}`;
    }
  }

  available(task: Task): boolean {
    return (
      super.available(task) && !(task.limit?.soft && this.attempts[task.name] >= task.limit.soft)
    );
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
