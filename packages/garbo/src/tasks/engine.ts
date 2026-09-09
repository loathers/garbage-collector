import {
  ContextualEngine,
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
  clearMaximizerCache,
  Delayed,
  get,
  have,
  SourceTerminal,
  undelay,
} from "libram";
import {
  booleanModifier,
  bufferToFile,
  equip,
  fileToBuffer,
  itemAmount,
  myFamiliar,
  print,
  todayToString,
  totalTurnsPlayed,
} from "kolmafia";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import { sessionSinceStart } from "../session";
import { garboValue } from "../garboValue";
import { shrugBadEffects } from "../mood";
import { checkPrefWatchReports } from "../report";
import { FarmingContext } from "./context";
import { BanishMethod, chooseBanish } from "../resources/banish";

export type GarboTask<Context = unknown> = StrictCombatTask<
  never,
  Context,
  GarboStrategy<Context>
> & {
  sobriety?: Delayed<"drunk" | "sober" | undefined, [Context]>;
  spendsTurn: Delayed<boolean, [Context]>;
  duplicate?: Delayed<boolean, [Context]>;
};

export type AlternateTask<Context = unknown> = GarboTask<Context> & {
  turns: Delayed<number>;
};

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
abstract class BaseGarboContextEngine<
  Context = unknown,
> extends ContextualEngine<never, Context, GarboTask<Context>> {
  static defaultSettings = {
    ...Engine.defaultSettings,
    choiceAdventureScript: "garbo_choice.js",
  };
  history: Array<{ name: string; startTime: number; durationMs: number }> = [];

  constructor(
    tasks: GarboTask<Context>[],
    options?: EngineOptions<never, Context, GarboTask<Context>> | undefined,
  ) {
    const startTime = Date.now();
    super(tasks, options);

    if (globalOptions.history) {
      this.history.push({
        name: "Engine/Construct",
        startTime,
        durationMs: Date.now() - startTime,
      });
    }
  }

  printExecutingMessage(task: GarboTask<Context>) {
    print(``);
    print(`Executing ${task.name}`, HIGHLIGHT);
  }

  destruct(): void {
    const startTime = Date.now();
    super.destruct();

    if (globalOptions.history) {
      this.history.push({
        name: "Engine/Destruct",
        startTime,
        durationMs: Date.now() - startTime,
      });
      const filename = `garbo_history_${todayToString()}.csv`;
      const buffer = fileToBuffer(filename).trim();
      const taskArray = [
        ...buffer.split("\n"),
        ...this.history.map(
          (item) =>
            `${item.startTime},${item.name.replace(",", "")},${item.durationMs}`,
        ),
      ];
      bufferToFile(taskArray.join("\n"), filename);
    }
  }

  available(task: GarboTask<Context>): boolean {
    safeInterrupt();
    const taskSober = undelay(task.sobriety, this.getContext(task));
    if (taskSober) {
      return (
        ((taskSober === "drunk" && !sober()) ||
          (taskSober === "sober" && sober())) &&
        super.available(task)
      );
    }
    return super.available(task);
  }

  dress(task: GarboTask<Context>, outfit: Outfit) {
    const duplicate = undelay(task.duplicate, this.getContext(task));
    if (duplicate && have($item`pro skateboard`) && !get("_epicMcTwistUsed")) {
      outfit.equip($item`pro skateboard`);
    }
    super.dress(task, outfit);
    const canBreathe = () => booleanModifier("Adventure Underwater");
    if (outfit.modifier.includes("+sea") && !canBreathe()) {
      clearMaximizerCache();
      super.dress(task, outfit);
      if (!canBreathe()) {
        throw new Error("Can't adventure underwater, figure it out.");
      }
    }
    if (itemAmount($item`tiny stillsuit`) > 0) {
      equip(
        myFamiliar() === $familiar`Cornbeefadon`
          ? $familiar`Mosquito`
          : $familiar`Cornbeefadon`,
        $item`tiny stillsuit`,
      );
    }
  }

  prepare(task: GarboTask<Context>): void {
    if ("combat" in task) safeRestore();
    super.prepare(task);
  }

  execute(task: GarboTask<Context>): void {
    const startTime = Date.now();
    const spentTurns = totalTurnsPlayed();
    const context = this.getContext(task);
    const duplicate = undelay(task.duplicate, context);
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
      if (!undelay(task.spendsTurn, context)) {
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

    checkPrefWatchReports();

    if (globalOptions.history) {
      this.history.push({
        name: task.name,
        startTime,
        durationMs: Date.now() - startTime,
      });
    }
  }

  markAttempt(task: GarboTask<Context>): void {
    super.markAttempt(task);
    if (
      !!globalOptions.halt &&
      task.name.localeCompare(globalOptions.halt, undefined, {
        sensitivity: "base",
      }) === 0
    ) {
      throw new Error(
        `Task halt requested for "${task.name}". Stopping Garbage Collector.`,
      );
    }
  }
}

export class BaseGarboEngine extends BaseGarboContextEngine<void> {
  getContext() {
    // noop
  }
}

export class FarmTurnEngine extends BaseGarboContextEngine<FarmingContext> {
  #banish: BanishMethod | null = null;

  getContext() {
    return { banish: this.#banish };
  }

  getNextTask() {
    this.#banish = chooseBanish();
    return super.getNextTask();
  }

  execute(task: GarboTask<FarmingContext>) {
    super.execute(task);
    this.#banish = null;
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
abstract class SafeGarboContextEngine<
  Context = unknown,
> extends BaseGarboContextEngine<Context> {
  constructor(tasks: GarboTask<Context>[]) {
    const options = new EngineOptions<never, Context>();
    options.default_task_options = { limit: { skip: 1 } };
    super(tasks, options);
  }
}

export class SafeGarboEngine extends SafeGarboContextEngine<void> {
  getContext() {
    // noop
  }
}

function runQuests<Context, T extends BaseGarboContextEngine<Context>>(
  quests: Quest<GarboTask<Context>, Context>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  garboEngine: new (...args: any[]) => T,
) {
  const engine = new garboEngine(getTasks(quests));

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}

export function runSafeGarboQuests(quests: Quest<GarboTask<void>>[]): void {
  runQuests(quests, SafeGarboEngine);
}

export function runGarboQuests(quests: Quest<GarboTask<void>>[]): void {
  runQuests(quests, BaseGarboEngine);
}

export function runGarboFarmQuests(
  quests: Quest<GarboTask<FarmingContext>, FarmingContext>[],
): void {
  runQuests(quests, FarmTurnEngine);
}
