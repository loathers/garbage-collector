import { Engine, StrictCombatTask } from "grimoire-kolmafia";
import { print } from "kolmafia";
import { HIGHLIGHT, safeInterrupt } from "../lib";
import wanderer from "../wanderer";

export type GarboTask = StrictCombatTask & { sobriety?: "drunk" | "sober" };

/** A base engine for Garbo!
 * Runs extra logic before executing all tasks.
 */
export class BaseGarboEngine extends Engine<never, GarboTask> {
  // Check for interrupt before executing a task
  execute(task: GarboTask): void {
    safeInterrupt();
    super.execute(task);
    wanderer.clear();
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
export class SafeGarboEngine extends BaseGarboEngine {
  // Garbo treats soft limits as completed, and continues on.
  markAttempt(task: GarboTask): void {
    super.markAttempt(task);

    if (task.completed()) return;
    const limit = task.limit?.soft || 1;
    if (this.attempts[task.name] >= limit) {
      task.completed = () => true;
      print(`Task ${task.name} did not complete within ${limit} attempts. Skipping.`, HIGHLIGHT);
    }
  }
}

export function runSafeGarboTasks(tasks: GarboTask[]): void {
  const engine = new SafeGarboEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}

export function runGarboTasks(tasks: GarboTask[]): void {
  const engine = new BaseGarboEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}
