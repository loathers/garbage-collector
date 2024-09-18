import {
  Engine,
  EngineOptions,
  getTasks,
  Outfit,
  Quest,
  StrictCombatTask,
} from "grimoire-kolmafia";
import {
  eventLog,
  isFree,
  MEAT_TARGET_MULTIPLIER,
  safeInterrupt,
  safeRestore,
  sober,
  targettingMeat,
} from "../lib";
import { wanderer } from "../garboWanderer";
import {
  $familiar,
  $item,
  $location,
  $skill,
  Delayed,
  get,
  have,
  PocketProfessor,
  set,
  SourceTerminal,
  undelay,
} from "libram";
import {
  equip,
  itemAmount,
  Location,
  mallPrice,
  print,
  retrieveItem,
  totalTurnsPlayed,
} from "kolmafia";
import { GarboStrategy } from "../combat";
import { globalOptions } from "../config";
import { sessionSinceStart } from "../session";
import { garboValue } from "../garboValue";
import { DraggableFight } from "garbo-lib";
import {
  crateStrategy,
  hasMonsterReplacers,
  totalGregCharges,
} from "../resources";
import { freeFightOutfit, meatTargetOutfit } from "../outfit";
import { checkUnderwater } from "../target/lib";

export type GarboTask = StrictCombatTask<never, GarboStrategy> & {
  sobriety?: Delayed<"drunk" | "sober" | undefined>;
  spendsTurn: Delayed<boolean>;
  duplicate?: Delayed<boolean>;
};

export type CopyTargetTask = (GarboTask & {
  canInitializeWandererCounters?: boolean;
}) &
  (
    | {
        fightType:
          | "wanderer"
          | "backup"
          | "regular"
          | "conditional"
          | "chainstarter"
          | "gregarious"
          | "emergencychainstarter"
          | "fake";
        wrongEncounterName?: boolean;
        amount?: () => number;
      }
    | { fightType?: undefined }
  );

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
export class BaseGarboEngine<T extends GarboTask> extends Engine<never, T> {
  available(task: T): boolean {
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

  dress(task: T, outfit: Outfit) {
    const duplicate = undelay(task.duplicate);
    if (duplicate && have($item`pro skateboard`) && !get("_epicMcTwistUsed")) {
      outfit.equip($item`pro skateboard`);
    }
    super.dress(task, outfit);
    if (itemAmount($item`tiny stillsuit`) > 0) {
      equip($familiar`Cornbeefadon`, $item`tiny stillsuit`);
    }
  }

  prepare(task: T): void {
    if ("combat" in task) safeRestore();
    super.prepare(task);
  }

  execute(task: T): void {
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
    wanderer().clear();
    sessionSinceStart().value(garboValue);
    if (duplicate && SourceTerminal.have()) {
      for (const skill of before) {
        SourceTerminal.educate(skill);
      }
    }
  }
}

export class CopyTargetEngine extends BaseGarboEngine<CopyTargetTask> {
  private lastFight: CopyTargetTask | null = null;
  private profChain: string | null = null;

  draggable(task: CopyTargetTask): DraggableFight | null {
    return (
      (["wanderer", "backup"] as const).find(
        (fightType) => fightType === task.fightType,
      ) ?? null
    );
  }

  underwater(task: CopyTargetTask): boolean {
    // Only run for copy target fights
    if (!task.fightType) return false;
    // Only run for _draggable_ copy target fights
    if (!this.draggable(task)) return false;
    // Only run if we can actually go underwater
    if (!checkUnderwater()) return false;
    // Only run if taffy is worth it
    if (
      mallPrice($item`pulled green taffy`) >
        (targettingMeat()
          ? MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")
          : get("valueOfAdventure")) &&
      retrieveItem($item`pulled green taffy`)
    ) {
      return false;
    }

    return true;
  }

  createOutfit(task: CopyTargetTask): Outfit {
    if (task.fightType) {
      const baseOutfit = undelay(task.outfit);
      const spec = baseOutfit
        ? baseOutfit instanceof Outfit
          ? baseOutfit.spec()
          : baseOutfit
        : {};

      // Prof chains
      if (have($familiar`Pocket Professor`) && !spec.familiar) {
        const chain = ["_garbo_meatChain", "_garbo_weightChain"].find(
          (pref) => !get(pref, false),
        );
        if (chain) {
          this.profChain = chain;
          spec.familiar = $familiar`Pocket Professor`;
          spec.famequip ??= $item`Pocket Professor memory chip`;
          spec.avoid ??= [];
          spec.avoid.push($item`Roman Candelabra`);
          if (chain === "_garbo_weightchain") {
            return Outfit.from(
              { ...spec, modifier: ["Familiar Weight"] },
              new Error("Unable to build outfit for weight chain!"),
            );
          }
        }
      }

      if (
        !spec.familiar &&
        !get("_badlyRomanticArrows") &&
        !this.underwater(task)
      ) {
        const { familiar, famequip } =
          [
            { familiar: $familiar`Reanimated Reanimator` },
            {
              familiar: $familiar`Obtuse Angel`,
              famequip: $item`quake of arrows`,
            },
          ].find(({ familiar }) => have(familiar)) ?? {};
        if (familiar) {
          spec.familiar = familiar;
          if (famequip) spec.famequip ??= famequip;
        }
      }

      if (isFree(globalOptions.target)) {
        const options = this.underwater(task)
          ? { location: $location`The Briny Deeps` }
          : {};
        return freeFightOutfit(spec, options);
      } else {
        if (task.do instanceof Location) return meatTargetOutfit(spec, task.do);
        if (this.underwater(task)) {
          return meatTargetOutfit(spec, $location`The Briny Deeps`);
        }
        return meatTargetOutfit(spec);
      }
    }

    return super.createOutfit(task);
  }

  do(task: CopyTargetTask) {
    if (this.profChain && PocketProfessor.currentlyAvailableLectures() <= 0) {
      return;
    }

    if (this.underwater(task)) {
      return $location`The Briny Deeps`;
    }
    return super.do(task);
  }

  // TODO: `proceedWithOrb` logic
  // Reconsider the way it works for free fights?
  // Reconsider
  findAvailableFight(type: CopyTargetTask["fightType"]) {
    return this.tasks.find(
      (task) => task.fightType === type && this.available(task),
    );
  }

  post(task: CopyTargetTask): void {
    this.lastFight = task;
    if (task.fightType === "gregarious" && totalGregCharges(true) === 0) {
      set("_garbo_doneGregging", true);
    }

    if (this.profChain) {
      set(this.profChain, true);
      this.profChain = null;
    }
    super.post(task);
  }

  getNextTask(): CopyTargetTask | undefined {
    // TO DO: allow for interpolating non-embezzler tasks into this
    // E.g., kramco, digitize initialization, crate-sabers, and proton ghosts
    // Actually I think those are it? I don't think there's a third

    // We do a wanderer if it's available, because they're basically involuntary
    const wanderer = this.findAvailableFight("wanderer");
    if (wanderer) return wanderer;

    // Conditional fights we want to do when we can
    // But we don't want to reset our orb with a gregarious fight; that defeats the purpose
    const conditional = this.findAvailableFight("conditional");
    if (conditional) {
      const hasReplacers = hasMonsterReplacers();

      const skipConditionals =
        conditional.fightType === "gregarious" &&
        crateStrategy() === "Orb" &&
        hasReplacers;

      if (!skipConditionals) return conditional;
    }

    const regularCopy =
      this.findAvailableFight("backup") ??
      this.findAvailableFight("regular") ??
      this.findAvailableFight("chainstarter");
    if (regularCopy) return regularCopy;
    return (
      conditional ??
      this.findAvailableFight("emergencychainstarter") ??
      undefined
    );
  }
}

/**
 * A safe engine for Garbo!
 * Treats soft limits as tasks that should be skipped, with a default max of one attempt for any task.
 */
export class SafeGarboEngine extends BaseGarboEngine<GarboTask> {
  constructor(tasks: GarboTask[]) {
    const options = new EngineOptions();
    options.default_task_options = { limit: { skip: 1 } };
    super(tasks, options);
  }
}

function runQuests<T extends GarboTask, E extends typeof BaseGarboEngine<T>>(
  quests: Quest<T>[],
  garboEngine: E,
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
