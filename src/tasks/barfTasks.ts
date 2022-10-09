import { Task as BaseTask } from "grimoire-kolmafia";
import {
  availableAmount,
  canAdventure,
  cliExecute,
  currentRound,
  eat,
  itemAmount,
  Location,
  mallPrice,
  myAdventures,
  myInebriety,
  myLevel,
  retrieveItem,
  runChoice,
  runCombat,
  totalTurnsPlayed,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  adventureMacro,
  adventureMacroAuto,
  clamp,
  Counter,
  ensureEffect,
  get,
  getModifier,
  have,
  Requirement,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "../combat";
import { barfFamiliar, freeFightFamiliar, meatFamiliar } from "../familiar";
import {
  embezzlerLog,
  globalOptions,
  kramcoGuaranteed,
  questStep,
  romanticMonsterImpossible,
  setChoice,
  sober,
} from "../lib";
import {
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  meatOutfit,
  waterBreathingEquipment,
} from "../outfit";
import { digitizedMonstersRemaining } from "../turns";
import { drunkSafeWander, wanderWhere } from "../wanderer";
import { completeBarfQuest } from "./daily";
import { deliverThesisIfAble } from "../fights";
import { computeDiet, consumeDiet } from "../diet";

const embezzler = $monster`Knob Goblin Embezzler`;

export enum Sobriety {
  SOBER = "sober",
  DRUNK = "drunk",
  EITHER = "either",
}

export type BarfTask = BaseTask & {
  sobriety: Sobriety;
  spendsTurn: boolean | (() => boolean);
};

export function logEmbezzler(encountertype: string): void {
  embezzlerLog.initialEmbezzlersFought++;
  embezzlerLog.sources.push(encountertype === "Digitize" ? encountertype : "Unknown Source");
}

function shouldGoUnderwater(): boolean {
  if (!sober()) return false;
  if (myLevel() < 11) return false;

  if (questStep("questS01OldGuy") === -1) {
    visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
  }

  if (
    !getModifier("Adventure Underwater") &&
    waterBreathingEquipment.every((item) => !have(item))
  ) {
    return false;
  }
  if (
    !getModifier("Underwater Familiar") &&
    familiarWaterBreathingEquipment.every((item) => !have(item))
  ) {
    return false;
  }

  if (have($item`envyfish egg`)) return false;
  if (!canAdventure($location`The Briny Deeps`)) return false;
  if (mallPrice($item`pulled green taffy`) < 3 * get("valueOfAdventure")) return false;
  return have($effect`Fishy`) || (have($item`fishy pipe`) && use($item`fishy pipe`));
}

type PrepOptions = {
  requirements?: Requirement;
  sea?: boolean;
  location?: Location;
};
function prep(type: "free" | "meat", options: PrepOptions = {}): void {
  if (type === "free") {
    useFamiliar(freeFightFamiliar({ location: options.location }));
    freeFightOutfit(options.requirements);
  } else {
    useFamiliar(meatFamiliar());
    meatOutfit(true, options.requirements, options.sea);
  }
}

const lightsOutReady: () => boolean = () =>
  totalTurnsPlayed() % 37 === 0 &&
  totalTurnsPlayed() !== get("lastLightsOutTurn") &&
  canAdventure(get("nextSpookyravenStephenRoom") ?? $location`none`);

const steveAdventures: Map<Location, number[]> = new Map([
  [$location`The Haunted Bedroom`, [1, 3, 1]],
  [$location`The Haunted Nursery`, [1, 2, 2, 1, 1]],
  [$location`The Haunted Conservatory`, [1, 2, 2]],
  [$location`The Haunted Billiards Room`, [1, 2, 2]],
  [$location`The Haunted Wine Cellar`, [1, 2, 2, 3]],
  [$location`The Haunted Boiler Room`, [1, 2, 2]],
  [$location`The Haunted Laboratory`, [1, 1, 3, 1, 1]],
]);

let digitize = -1;

const needTurns: () => boolean = () => myAdventures() === 1 + globalOptions.saveTurns && sober();

export const barfTasks: BarfTask[] = [
  {
    name: "Lights Out",
    ready: () => lightsOutReady(),
    do: (): void => {
      const steveRoom = get("nextSpookyravenStephenRoom");
      const ghostLocation = get("ghostLocation");
      if (steveRoom && canAdventure(steveRoom) && steveRoom !== ghostLocation) {
        const fightingSteve = steveRoom === $location`The Haunted Laboratory`;
        // Technically drops 500 meat, but that's close enough for me.
        const drunkRequirement = sober()
          ? undefined
          : new Requirement([], { forceEquip: $items`Drunkula's wineglass` });
        if (fightingSteve) prep("meat", { requirements: drunkRequirement });
        const plan = steveAdventures.get(steveRoom);
        if (plan) {
          withMacro(
            Macro.if_($monster`Stephen Spookyraven`, Macro.basicCombat()).abort(),
            () => {
              visitUrl(toUrl(steveRoom));
              for (const choiceValue of plan) {
                runChoice(choiceValue);
              }
              if (fightingSteve || currentRound()) runCombat();
            },
            true
          );
        }
      }
    },
    spendsTurn: () => get("nextSpookyravenStephenRoom") === $location`The Haunted Laboratory`,
    sobriety: Sobriety.EITHER,
    completed: () =>
      totalTurnsPlayed() === get("lastLightsOutTurn") ||
      get("lastEncounter") === "Stephen Spookyraven",
  },
  {
    name: "Proton Ghost",
    ready: () =>
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") !== "unstarted" &&
      !!get("ghostLocation"),
    do: (): void => {
      const ghostLocation = get("ghostLocation");
      if (ghostLocation) {
        prep("free", {
          requirements: new Requirement(
            ghostLocation === $location`The Icy Peak` ? ["Cold Resistance 5 min"] : [],
            {
              forceEquip: $items`protonic accelerator pack`,
            }
          ),
        });
        adventureMacro(ghostLocation, Macro.ghostBustin());
      }
    },
    completed: () => get("questPAGhost") === "unstarted",
    spendsTurn: false,
    // Ghost fights are currently hard
    // and they resist physical attacks!
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Vote Wanderer",
    ready: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3,
    do: (): void => {
      const isGhost = get("_voteMonster") === $monster`angry ghost`;
      const isMutant = get("_voteMonster") === $monster`terrible mutant`;
      prep("free", {
        requirements: new Requirement([], {
          forceEquip: [
            $item`"I Voted!" sticker`,
            ...(!sober() && !isGhost ? $items`Drunkula's wineglass` : []),
            ...(!have($item`mutant crown`) && isMutant
              ? $items`mutant arm, mutant legs`.filter((i) => have(i))
              : []),
          ],
        }),
      });
      adventureMacroAuto(
        isGhost ? drunkSafeWander("wanderer") : wanderWhere("wanderer"),
        Macro.basicCombat()
      );
    },
    completed: () => get("lastVoteMonsterTurn") === totalTurnsPlayed(),
    spendsTurn: false,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Digitize Wanderer",
    ready: () => Counter.get("Digitize Monster") <= 0,
    do: (): void => {
      // This check exists primarily for the ease of modded garbos
      const isEmbezzler = SourceTerminal.getDigitizeMonster() === embezzler;
      digitize = get("_sourceTerminalDigitizeMonsterCount");

      const underwater = isEmbezzler && shouldGoUnderwater();

      const targetLocation = underwater ? $location`The Briny Deeps` : drunkSafeWander("wanderer");

      if (underwater) retrieveItem($item`pulled green taffy`);

      isEmbezzler ? prep("meat", { sea: underwater }) : prep("free");
      adventureMacroAuto(
        targetLocation,
        Macro.externalIf(underwater, Macro.item($item`pulled green taffy`)).meatKill(),

        // Hacky fix for when we fail init to embezzler, who are special monsters
        // Macro autoattacks fail when you lose the jump to special monsters
        Macro.if_(
          `(monsterid ${embezzler.id}) && !gotjump && !(pastround 2)`,
          Macro.externalIf(underwater, Macro.item($item`pulled green taffy`)).meatKill()
        ).abort()
      );
      return;
    },
    spendsTurn: () => !SourceTerminal.getDigitizeMonster()?.attributes.includes("FREE"),
    sobriety: Sobriety.EITHER,
    completed: () => get("_sourceTerminalDigitizeMonsterCount") !== digitize,
  },
  {
    name: "Guaranteed Kramco",
    ready: () => kramcoGuaranteed(),
    do: (): void => {
      prep("free", {
        requirements: new Requirement([], { forceEquip: $items`Kramco Sausage-o-Matic™` }),
      });
      adventureMacroAuto(drunkSafeWander("wanderer"), Macro.basicCombat());
    },
    completed: () => !kramcoGuaranteed(),
    spendsTurn: false,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Void Monster",
    ready: () =>
      have($item`cursed magnifying glass`) &&
      get("cursedMagnifyingGlassCount") === 13 &&
      get("_voidFreeFights") < 5,
    do: (): void => {
      prep("free", {
        requirements: new Requirement([], { forceEquip: $items`cursed magnifying glass` }),
      });
      adventureMacroAuto(drunkSafeWander("wanderer"), Macro.basicCombat());
    },
    completed: () => get("cursedMagnifyingGlassCount") === 0,
    spendsTurn: false,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Envyfish Egg",
    ready: () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed"),
    do: (): void => {
      prep("meat");
      withMacro(Macro.meatKill(), () => use($item`envyfish egg`), true);
    },
    completed: () => get("_envyfishEggUsed"),
    spendsTurn: true,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Spit Acid",
    ready: () =>
      have($item`Jurassic Parka`) &&
      !have($effect`Everything Looks Yellow`) &&
      romanticMonsterImpossible(),
    do: (): void => {
      const location = wanderWhere("yellow ray");
      prep("free", {
        location,
        requirements: new Requirement([], { forceEquip: $items`Jurassic Parka` }),
      });
      cliExecute("parka dilophosaur");
      const macro = Macro.if_(embezzler, Macro.meatKill())
        .familiarActions()
        .skill($skill`Spit jurassic acid`);
      adventureMacroAuto(location, macro);
    },
    completed: () => have($effect`Everything Looks Yellow`),
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Map for Pills",
    ready: () =>
      globalOptions.ascending &&
      clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) <=
        availableAmount($item`Map to Safety Shelter Grimace Prime`),
    do: (): void => {
      const choiceToSet =
        availableAmount($item`distention pill`) <
        availableAmount($item`synthetic dog hair pill`) +
          availableAmount($item`Map to Safety Shelter Grimace Prime`)
          ? 1
          : 2;
      setChoice(536, choiceToSet);
      ensureEffect($effect`Transpondent`);
      use($item`Map to Safety Shelter Grimace Prime`);
    },
    completed: () => true,
    spendsTurn: true,
    sobriety: Sobriety.DRUNK,
  },
  {
    name: "Thesis",
    ready: needTurns,
    do: deliverThesisIfAble,
    completed: () => !needTurns(),
    sobriety: Sobriety.SOBER,
    spendsTurn: false,
  },
  {
    name: "Sausages",
    ready: () =>
      needTurns() &&
      have($item`Kramco Sausage-o-Matic™`) &&
      (have($item`magical sausage`) || have($item`magical sausage casing`)) &&
      get("_sausagesEaten") < 23,
    do: (): void => {
      const available = clamp(
        23 - get("_sausagesEaten"),
        0,
        itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`)
      );
      eat(available, $item`magical sausage`);
    },
    completed: () => !needTurns(),
    sobriety: Sobriety.EITHER,
    spendsTurn: false,
  },
  {
    name: "Sweatpants",
    ready: () => needTurns() && have($item`designer sweatpants`) && globalOptions.noDiet,
    do: (): void => {
      while (get("_sweatOutSomeBoozeUsed", 0) < 3 && get("sweat", 0) >= 25 && myInebriety() > 0) {
        useSkill($skill`Sweat Out Some Booze`);
      }
      consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
    },
    completed: () => !needTurns(),
    sobriety: Sobriety.SOBER,
    spendsTurn: false,
  },
  {
    name: "Barf",
    ready: () => true,
    do: (): void => {
      useFamiliar(barfFamiliar());
      const lubing = get("dinseyRollercoasterNext") && have($item`lube-shoes`);
      meatOutfit(
        false,
        lubing ? new Requirement([], { forceEquip: $items`lube-shoes` }) : undefined
      );
      adventureMacroAuto(
        $location`Barf Mountain`,
        Macro.meatKill(),
        Macro.if_(
          `(monsterid ${$monster`Knob Goblin Embezzler`.id}) && !gotjump && !(pastround 2)`,
          Macro.meatKill()
        ).abort()
      );
      completeBarfQuest();
    },
    completed: () => true,
    spendsTurn: true,
    sobriety: Sobriety.EITHER,
  },
];
