import { Engine, Task } from "grimoire-kolmafia";
import { myAdventures, myTurncount, print, totalTurnsPlayed } from "kolmafia";
import { get } from "libram";
import { globalOptions, safeInterrupt, safeRestore, sober } from "../lib";
import { meatMood } from "../mood";
import { tryFillLatte } from "../outfit";
import postCombatActions from "../post";
import { estimatedTurns } from "../turns";
import { BarfTask, logEmbezzler, Sobriety } from "./barfTasks";

export function canContinue(): boolean {
  return (
    myAdventures() > globalOptions.saveTurns &&
    (globalOptions.stopTurncount === null || myTurncount() < globalOptions.stopTurncount)
  );
}

/** A base engine for Garbo!
 * Runs extra logic before executing all tasks.
 */
export class BaseGarboEngine<
  A extends string = never,
  T extends Task<A> = Task<never>
> extends Engine<A, T> {
  // Check for interrupt before executing a task
  execute(task: T): void {
    safeInterrupt();
    super.execute(task);
  }

  run(actions?: number | undefined): void {
    for (let i = 0; i < (actions ?? Infinity); i++) {
      if (!canContinue()) return;
      const task = this.getNextTask();
      if (!task) return;
      this.execute(task);
    }
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
export class SafeGarboEngine<
  A extends string = never,
  T extends Task<A> = Task<never>
> extends BaseGarboEngine<A, T> {
  // Garbo treats soft limits as completed, and continues on.
  markAttempt(task: T): void {
    super.markAttempt(task);

    if (task.completed()) return;
    const limit = task.limit?.soft || 1;
    if (this.attempts[task.name] >= limit) {
      task.completed = () => true;
      print(`Task ${task.name} did not complete within ${limit} attempts. Skipping.`, "yellow");
    }
  }
}

export class BarfTaskEngine extends BaseGarboEngine<never, BarfTask> {
  failures = 0;

  available(task: BarfTask): boolean {
    const validSobrieties = [Sobriety.EITHER, sober() ? Sobriety.SOBER : Sobriety.DRUNK];
    return validSobrieties.includes(task.sobriety) && (task.ready === undefined || task.ready());
  }

  execute(task: BarfTask): void {
    tryFillLatte();
    meatMood().execute(estimatedTurns());
    safeRestore();

    const startTurns = totalTurnsPlayed();

    super.execute(task);

    const foughtAnEmbezzler = get("lastEncounter") === "Knob Goblin Embezzler";
    if (foughtAnEmbezzler) logEmbezzler(task.name);

    if (
      totalTurnsPlayed() > startTurns &&
      !(typeof task.spendsTurn === "function" ? task.spendsTurn() : task.spendsTurn)
    ) {
      print(`We unexpectedly spent a turn doing ${task.name}!`, "red");
    }

    if (task.completed() || task.alwaysSucceeds) {
      this.failures = 0;
    } else {
      this.failures += 1;
      if (this.failures >= 3) {
        throw new Error("Tried thrice to adventure, and failed each time. Aborting.");
      }
    }
    postCombatActions();
  }
}

function runEngineTasks<A extends string, T extends Task<A>, E extends Engine<A, T>>(engineType: {
  new (t: T[]): E;
}): (tasks: T[]) => void {
  return (tasks: T[]) => {
    const engine = new engineType(tasks);

    try {
      engine.run();
    } finally {
      engine.destruct();
    }
  };
}

export const runSafeGarboTasks = runEngineTasks(SafeGarboEngine);
export const runGarboTasks = runEngineTasks(BaseGarboEngine);
export const runBarfTasks = runEngineTasks(BarfTaskEngine);
