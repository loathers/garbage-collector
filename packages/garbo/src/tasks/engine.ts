import {
  Engine,
  EngineOptions,
  getTasks,
  Outfit,
  Quest,
  StrictCombatTask,
} from "grimoire-kolmafia";
import { eventLog, HIGHLIGHT, safeInterrupt, safeRestore, sober } from "../lib";
import { wanderer } from "../garboWanderer";
import {
  $effect,
  $familiar,
  $item,
  $skill,
  Delayed,
  get,
  have,
  SourceTerminal,
  undelay,
} from "libram";
import {
  equip,
  itemAmount,
  myFamiliar,
  print,
  totalTurnsPlayed,
} from "kolmafia";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import { sessionSinceStart } from "../session";
import { garboValue } from "../garboValue";
import { shrugBadEffects } from "../mood";

export type GarboTask = StrictCombatTask<never, GarboStrategy> & {
  sobriety?: Delayed<"drunk" | "sober" | undefined>;
  spendsTurn: Delayed<boolean>;
  duplicate?: Delayed<boolean>;
};

export type AlternateTask = GarboTask & { turns: Delayed<number> };

function logTargetFight(encounterType: string) {
  const isDigitize = encounterType.includes("Digitize Wanderer");
  if (isDigitize) {
    eventLog.digitizedCopyTargetsFought++;
  } else {
    eventLog.initialCopyTargetsFought++;
  }
  eventLog.copyTargetSources.push(isDigitize ? "Digitize" : "Unknown Source");
}

/** A base engine for Garbo!
 * Runs extra logic before executing all tasks.
 */
export class BaseGarboEngine extends Engine<never, GarboTask> {
  static defaultSettings = {
    ...Engine.defaultSettings,
    choiceAdventureScript: "garbo_choice.js",
  };

  printExecutingMessage(task: GarboTask) {
    print(``);
    print(`Executing ${task.name}`, HIGHLIGHT);
  }

  available(task: GarboTask): boolean {
    safeInterrupt();
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
    const duplicate = undelay(task.duplicate);
    if (duplicate && have($item`pro skateboard`) && !get("_epicMcTwistUsed")) {
      outfit.equip($item`pro skateboard`);
    }
    super.dress(task, outfit);
    if (itemAmount($item`tiny stillsuit`) > 0) {
      equip(
        myFamiliar() === $familiar`Cornbeefadon`
          ? $familiar`Mosquito`
          : $familiar`Cornbeefadon`,
        $item`tiny stillsuit`,
      );
    }
  }

  prepare(task: GarboTask): void {
    if ("combat" in task) safeRestore();
    super.prepare(task);
  }

  execute(task: GarboTask): void {
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
    const foughtATarget = get("lastEncounter") === globalOptions.target.name;
    if (foughtATarget) logTargetFight(task.name);
    shrugBadEffects($effect`Feeling Lost`); // We deliberately use Feeling Lost sometimes
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

function runQuests<T extends typeof BaseGarboEngine>(
  quests: Quest<GarboTask>[],
  garboEngine: T,
) {
  const engine = new garboEngine(getTasks(quests));

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}

export function runSafeGarboQuests(quests: Quest<GarboTask>[]): void {
  runQuests(quests, SafeGarboEngine);
}

export function runGarboQuests(quests: Quest<GarboTask>[]): void {
  runQuests(quests, BaseGarboEngine);
}
