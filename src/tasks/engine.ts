import { Engine, StrictCombatTask } from "grimoire-kolmafia";
import { safeInterrupt } from "../lib";
import wanderer from "../wanderer";

export type GarboTask = StrictCombatTask & { sobriety?: "drunk" | "sober"; tryOnce?: boolean };

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
  available(task: GarboTask): boolean {
    return super.available(task) && (!task.tryOnce || this.attempts[task.name] >= 1);
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
