import { returnExhaustedStashItems } from "../stash";
import {
  ContextualEngine,
  Engine,
  EngineOptions,
  Outfit,
  Quest,
} from "grimoire-kolmafia";
import { eventLog, HIGHLIGHT, safeInterrupt, sober } from "../lib";
import { safeRestore } from "../restore";
import { wanderer } from "../garboWanderer";
import {
  $effect,
  $familiar,
  $item,
  $skill,
  clearMaximizerCache,
  get,
  have,
  SongBoom,
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
import { globalOptions } from "../config";
import { sessionSinceStart } from "../session";
import { garboValue } from "../garboValue";
import { freeFightMood, shrugBadEffects } from "../mood";
import { checkPrefWatchReports } from "../report";
import { AdventureContext, adventureContext, FarmingContext } from "./context";
import { BanishMethod, chooseBanish } from "../resources/banish";
import { FarmingStrategy } from "../farmingStrategy";
import {
  shouldCollectSongBoomSeasoning,
  shouldRestoreSongBoomMeat,
} from "../resources/songBoom";

import {
  AdaptedTask,
  adaptTask,
  GarboTask,
  getGarboTasks,
  MappingTask,
} from "./task";
export type {
  AlternateTask,
  FarmingTask,
  GarboTask,
  MappingTask,
} from "./task";

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
  Context extends AdventureContext,
> extends ContextualEngine<never, Context, AdaptedTask<Context>> {
  static defaultSettings = {
    ...Engine.defaultSettings,
    choiceAdventureScript: "garbo_choice.js",
  };
  history: Array<{ name: string; startTime: number; durationMs: number }> = [];
  #contexts = new Map<AdaptedTask<Context>, Context>();

  protected abstract createContext(task: AdaptedTask<Context>): Context;

  protected createAdventureContext(
    task: AdaptedTask<Context>,
  ): AdventureContext {
    return adventureContext(() => {
      if (task.adventure !== undefined) {
        return undelay(task.adventure, this.getContext(task));
      }
      throw new Error(`Task ${task.name} has no adventure`);
    });
  }

  getContext(task: AdaptedTask<Context>): Context {
    const cached = this.#contexts.get(task);
    if (cached) return cached;

    const context = this.createContext(task);
    this.#contexts.set(task, context);
    return context;
  }

  getNextTask() {
    this.#contexts.clear();
    return super.getNextTask();
  }

  constructor(
    tasks: GarboTask<Context>[],
    options?: EngineOptions<never, Context, AdaptedTask<Context>> | undefined,
  ) {
    const startTime = Date.now();
    super(
      tasks.map((task) => adaptTask<Context, GarboTask<Context>>(task)),
      options,
    );

    if (globalOptions.history) {
      this.history.push({
        name: "Engine/Construct",
        startTime,
        durationMs: Date.now() - startTime,
      });
    }
  }

  printExecutingMessage(task: AdaptedTask<Context>) {
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

  available(task: AdaptedTask<Context>): boolean {
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

  dress(task: AdaptedTask<Context>, outfit: Outfit) {
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

  prepare(task: AdaptedTask<Context>): void {
    if ("combat" in task) safeRestore();
    super.prepare(task);
  }

  execute(task: AdaptedTask<Context>): void {
    this.#contexts.clear();
    try {
      this.executeWithContext(task);
    } finally {
      this.#contexts.clear();
    }
  }

  private executeWithContext(task: AdaptedTask<Context>): void {
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
    returnExhaustedStashItems();
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

  markAttempt(task: AdaptedTask<Context>): void {
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

class BaseGarboEngine extends BaseGarboContextEngine<AdventureContext> {
  protected createContext(task: AdaptedTask<AdventureContext>) {
    return this.createAdventureContext(task);
  }
}

class FreeFightEngine extends BaseGarboEngine {
  private consecutiveNonFreeFights = 0;

  constructor(
    tasks: (GarboTask<AdventureContext> & { combatCount?: () => number })[],
  ) {
    super(
      tasks.map((task) => {
        if (task.limit || !task.combatCount) return task;
        // Snapshot the padded attempt budget when the engine starts.
        return { ...task, limit: { skip: 5 + task.combatCount() } };
      }),
    );
  }

  available(
    task: AdaptedTask<AdventureContext, MappingTask<AdventureContext>>,
  ): boolean {
    return (
      (!get("mappingMonsters") ||
        undelay(task.mapSafe, this.getContext(task)) === true) &&
      super.available(task)
    );
  }

  getNextTask() {
    const task = super.getNextTask();
    if (!task && get("mappingMonsters")) {
      throw new Error(
        "Mapping is still active, but no map-safe free-fight task is available. Resolve the pending map before continuing.",
      );
    }
    return task;
  }

  acquireEffects(task: AdaptedTask<AdventureContext>): void {
    if ("combat" in task) {
      freeFightMood(
        ...(undelay(task.effects, this.getContext(task)) ?? []),
      ).execute();
    }
    super.acquireEffects(task);
  }

  execute(task: AdaptedTask<AdventureContext>): void {
    const before = totalTurnsPlayed();
    const expectsFreeCombat =
      !!task.combat && !undelay(task.spendsTurn, this.getContext(task));
    super.execute(task);
    if (!expectsFreeCombat) return;
    if (totalTurnsPlayed() > before) {
      this.consecutiveNonFreeFights++;
    } else {
      this.consecutiveNonFreeFights = 0;
    }
    if (this.consecutiveNonFreeFights >= 5) {
      throw new Error("The last 5 free fights spent turns!");
    }
  }
}

class FarmTurnEngine extends BaseGarboContextEngine<FarmingContext> {
  #banish: BanishMethod | null = null;

  dress(task: AdaptedTask<FarmingContext>, outfit: Outfit) {
    super.dress(task, outfit);
    if (!task.combat) return;

    const context = this.getContext(task);
    if (!undelay(task.spendsTurn, context)) return;

    const { target } = context.adventure;

    // SongBoom decisions should be made after building & equipping the outfit, but before compiling the macros.
    if (shouldRestoreSongBoomMeat(target)) {
      SongBoom.setSong("Total Eclipse of Your Meat");
    } else if (shouldCollectSongBoomSeasoning(target)) {
      SongBoom.setSong("Food Vibrations");
    }
  }

  protected createContext(task: AdaptedTask<FarmingContext>): FarmingContext {
    const context = this.createAdventureContext(task);
    return {
      banish: this.#banish,
      get adventure() {
        return context.adventure;
      },
    };
  }

  getNextTask() {
    this.#banish = chooseBanish(
      FarmingStrategy.banishMonsters,
      FarmingStrategy.primaryMonster(),
    );
    return super.getNextTask();
  }

  execute(task: AdaptedTask<FarmingContext>) {
    try {
      super.execute(task);
    } finally {
      this.#banish = null;
    }
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
abstract class SafeGarboContextEngine<
  Context extends AdventureContext,
> extends BaseGarboContextEngine<Context> {
  constructor(tasks: GarboTask<Context>[]) {
    const options = new EngineOptions<never, Context, AdaptedTask<Context>>();
    options.default_task_options = { limit: { skip: 1 } };
    super(tasks, options);
  }
}

class SafeGarboEngine extends SafeGarboContextEngine<AdventureContext> {
  protected createContext(task: AdaptedTask<AdventureContext>) {
    return this.createAdventureContext(task);
  }
}

function runQuests<Context extends AdventureContext>(
  quests: Quest<GarboTask<Context>, Context>[],
  EngineClass: new (
    tasks: GarboTask<Context>[],
  ) => BaseGarboContextEngine<Context>,
) {
  const engine = new EngineClass(getGarboTasks(quests));

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}

export function runSafeGarboQuests(
  quests: Quest<GarboTask<AdventureContext>, AdventureContext>[],
): void {
  runQuests(quests, SafeGarboEngine);
}

export function runGarboQuests(
  quests: Quest<GarboTask<AdventureContext>, AdventureContext>[],
): void {
  runQuests(quests, BaseGarboEngine);
}

export function runGarboFreeFightQuests(
  quests: Quest<MappingTask<AdventureContext>, AdventureContext>[],
): void {
  runQuests(quests, FreeFightEngine);
}

export function runGarboFarmQuests(
  quests: Quest<GarboTask<FarmingContext>, FarmingContext>[],
): void {
  runQuests(quests, FarmTurnEngine);
}
