import {
  Engine,
  EngineOptions,
  getTasks,
  Outfit,
  Quest,
  StrictCombatTask,
} from "grimoire-kolmafia";
import { eventLog, safeInterrupt, safeRestore, sober } from "../lib";
import { wanderer } from "../garboWanderer";
import {
  $familiar,
  $item,
  $skill,
  Delayed,
  get,
  SourceTerminal,
  undelay,
} from "libram";
import { equip, itemAmount, print, totalTurnsPlayed } from "kolmafia";
import { GarboStrategy } from "../combat";
import { globalOptions } from "../config";
import { sessionSinceStart } from "../session";
import { garboValue } from "../garboValue";

export type GarboTask = StrictCombatTask<never, GarboStrategy> & {
  sobriety?: Delayed<"drunk" | "sober" | undefined>;
  spendsTurn: Delayed<boolean>;
  duplicate?: Delayed<boolean>;
};

function logEmbezzler(encounterType: string) {
  const isDigitize = encounterType.includes("Digitize Wanderer");
  isDigitize
    ? eventLog.digitizedCopyTargetsFought++
    : eventLog.initialCopyTargetsFought++;
  eventLog.copyTargetSources.push(isDigitize ? "Digitize" : "Unknown Source");
}

/** A base engine for Garbo!
 * Runs extra logic before executing all tasks.
 */
export class BaseGarboEngine extends Engine<never, GarboTask> {
  available(task: GarboTask): boolean {
    const taskSober = undelay(task.sobriety);
    if (taskSober) {
      return (
        ((taskSober === "drunk" && !sober()) ||
          (taskSober === "sober" && sober())) &&
        super.available(task)
      );
    }
    return super.available(task);
  }

  dress(task: GarboTask, outfit: Outfit) {
    super.dress(task, outfit);
    if (itemAmount($item`tiny stillsuit`) > 0) {
      equip($familiar`Cornbeefadon`, $item`tiny stillsuit`);
    }
  }

  prepare(task: GarboTask): void {
    if ("combat" in task) safeRestore();
    super.prepare(task);
  }

  execute(task: GarboTask): void {
    safeInterrupt();
    const spentTurns = totalTurnsPlayed();
    const duplicate = undelay(task.duplicate);
    const before = SourceTerminal.getSkills();
    if (
      duplicate &&
      SourceTerminal.have() &&
      SourceTerminal.duplicateUsesRemaining() > 0
    ) {
      SourceTerminal.educate([$skill`Extract`, $skill`Duplicate`]);
    }
    super.execute(task);
    if (totalTurnsPlayed() !== spentTurns) {
      if (!undelay(task.spendsTurn)) {
        print(
          `Task ${task.name} spent a turn but was marked as not spending turns`,
        );
      }
    }
    const foughtAnEmbezzler =
      get("lastEncounter") === globalOptions.target.name;
    if (foughtAnEmbezzler) logEmbezzler(task.name);
    wanderer().clear();
    sessionSinceStart().value(garboValue);
    if (duplicate && SourceTerminal.have()) {
      for (const skill of before) {
        SourceTerminal.educate(skill);
      }
    }
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
export class SafeGarboEngine extends BaseGarboEngine {
  constructor(tasks: GarboTask[]) {
    const options = new EngineOptions();
    options.default_task_options = { limit: { skip: 1 } };
    super(tasks, options);
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

export function runSafeGarboQuests(quests: Quest<GarboTask>[]): void {
  runSafeGarboTasks(getTasks(quests));
}

export function runGarboTasks(tasks: GarboTask[]): void {
  const engine = new BaseGarboEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}

export function runGarboQuests(quests: Quest<GarboTask>[]): void {
  runGarboTasks(getTasks(quests));
}
