import {
  availableAmount,
  canAdventure,
  cliExecute,
  currentRound,
  eat,
  inebrietyLimit,
  itemAmount,
  Location,
  mallPrice,
  myAdventures,
  myInebriety,
  myLevel,
  print,
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
import { Macro, withMacro } from "./combat";
import { completeBarfQuest } from "./dailies";
import { computeDiet, consumeDiet } from "./diet";
import { estimatedTurns } from "./embezzler";
import { barfFamiliar, freeFightFamiliar, meatFamiliar } from "./familiar";
import { deliverThesisIfAble } from "./fights";
import {
  embezzlerLog,
  globalOptions,
  kramcoGuaranteed,
  questStep,
  romanticMonsterImpossible,
  safeRestore,
  setChoice,
} from "./lib";
import { meatMood } from "./mood";
import {
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  meatOutfit,
  tryFillLatte,
  waterBreathingEquipment,
} from "./outfit";
import { determineDraggableZoneAndEnsureAccess, digitizedMonstersRemaining } from "./wanderer";
const embezzler = $monster`Knob Goblin Embezzler`;

type EmbezzlerPrepOptions = {
  requirements?: Requirement;
  sea?: boolean;
};
function embezzlerPrep(options: EmbezzlerPrepOptions = {}) {
  useFamiliar(meatFamiliar());
  meatOutfit(true, options.requirements, options.sea);
}

function freeFightPrep(requirements?: Requirement) {
  useFamiliar(freeFightFamiliar());
  freeFightOutfit(requirements);
}

function logEmbezzler(encountertype: string) {
  embezzlerLog.initialEmbezzlersFought++;
  embezzlerLog.sources.push(encountertype === "Digitize" ? encountertype : "Unknown Source");
}

function shouldGoUnderwater(): boolean {
  if (myInebriety() > inebrietyLimit()) return false;
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

// Lights Out adventures require you to take several choices in a row
const steveAdventures: Map<Location, number[]> = new Map([
  [$location`The Haunted Bedroom`, [1, 3, 1]],
  [$location`The Haunted Nursery`, [1, 2, 2, 1, 1]],
  [$location`The Haunted Conservatory`, [1, 2, 2]],
  [$location`The Haunted Billiards Room`, [1, 2, 2]],
  [$location`The Haunted Wine Cellar`, [1, 2, 2, 3]],
  [$location`The Haunted Boiler Room`, [1, 2, 2]],
  [$location`The Haunted Laboratory`, [1, 1, 3, 1, 1]],
]);

enum Sobriety {
  SOBER = "sober",
  DRUNK = "drunk",
  EITHER = "either",
}

/**
 * Describes an action we could take as part of our barf-turn loop.
 * Has a name, a a function to determine availability, and a function that executes the turn.
 * Execute function returns whether we succeeded.
 */
type AdventureAction = {
  name: string;
  available: () => boolean;
  execute: () => boolean;
  spendsTurn: boolean | (() => boolean);
  sobriety: Sobriety;
};

// This is roughly ordered by the encounter ontology, followed by general priority
const turns: AdventureAction[] = [
  {
    name: "Lights Out",
    available: () =>
      totalTurnsPlayed() % 37 === 0 &&
      totalTurnsPlayed() !== get("lastLightsOutTurn") &&
      canAdventure(get("nextSpookyravenStephenRoom") ?? $location`none`),
    execute: () => {
      const steveRoom = get("nextSpookyravenStephenRoom");
      const ghostLocation = get("ghostLocation");
      if (steveRoom && canAdventure(steveRoom) && steveRoom !== ghostLocation) {
        const fightingSteve = steveRoom === $location`The Haunted Laboratory`;
        // Technically drops 500 meat, but that's close enough for me.
        if (fightingSteve) embezzlerPrep();
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
        return totalTurnsPlayed() === get("lastLightsOutTurn");
      }
      return false;
    },
    spendsTurn: () => get("nextSpookyravenStephenRoom") === $location`The Haunted Laboratory`,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Proton Ghost",
    available: () =>
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") !== "unstarted" &&
      !!get("ghostLocation"),
    execute: () => {
      const ghostLocation = get("ghostLocation");
      if (!ghostLocation) return false;
      freeFightPrep(
        new Requirement(
          ghostLocation === $location`The Icy Peak` ? ["Cold Resistance 5 min"] : [],
          {
            forceEquip: $items`protonic accelerator pack`,
          }
        )
      );
      adventureMacro(ghostLocation, Macro.ghostBustin());
      return get("questPAGhost") === "unstarted";
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Vote Wanderer",
    available: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3,
    execute: () => {
      freeFightPrep(new Requirement([], { forceEquip: $items`"I Voted!" sticker` }));
      adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
      return get("lastVoteMonsterTurn") === totalTurnsPlayed();
    },
    spendsTurn: false,
    sobriety: get("_voteMonster") === $monster`angry ghost` ? Sobriety.SOBER : Sobriety.EITHER,
  },
  {
    name: "Digitize Wanderer",
    available: () => Counter.get("Digitize Monster") <= 0,
    execute: () => {
      // This check exists primarily for the ease of modded garbos
      const isEmbezzler = SourceTerminal.getDigitizeMonster() === embezzler;
      const start = get("_sourceTerminalDigitizeMonsterCount");

      const underwater = isEmbezzler && shouldGoUnderwater();

      const targetLocation = underwater
        ? $location`The Briny Deeps`
        : determineDraggableZoneAndEnsureAccess();

      if (underwater) retrieveItem($item`pulled green taffy`);

      isEmbezzler ? embezzlerPrep({ sea: underwater }) : freeFightPrep();
      adventureMacroAuto(
        targetLocation,
        Macro.externalIf(underwater, Macro.item($item`pulled green taffy`)).meatKill()
      );
      return get("_sourceTerminalDigitizeMonsterCount") !== start;
    },
    spendsTurn: () => !SourceTerminal.getDigitizeMonster()?.attributes.includes("FREE"),
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Guaranteed Kramco",
    available: () => kramcoGuaranteed(),
    execute: () => {
      freeFightPrep(new Requirement([], { forceEquip: $items`Kramco Sausage-o-Matic™` }));
      adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
      return !kramcoGuaranteed();
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Void Monster",
    available: () =>
      have($item`cursed magnifying glass`) &&
      get("cursedMagnifyingGlassCount") === 13 &&
      get("_voidFreeFights") < 5,
    execute: () => {
      freeFightPrep(new Requirement([], { forceEquip: $items`cursed magnifying glass` }));
      adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
      return get("cursedMagnifyingGlassCount") === 0;
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Envyfish Egg",
    available: () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed"),
    execute: () => {
      embezzlerPrep();
      withMacro(Macro.meatKill(), () => use($item`envyfish egg`), true);
      return get("_envyfishEggUsed");
    },
    spendsTurn: true,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Spit Acid",
    available: () =>
      have($item`Jurassic Parka`) &&
      !have($effect`Everything Looks Yellow`) &&
      romanticMonsterImpossible(),
    execute: () => {
      const location = determineDraggableZoneAndEnsureAccess("yellow ray");
      const familiar = freeFightFamiliar({ location });
      useFamiliar(familiar);
      freeFightOutfit(new Requirement([], { forceEquip: $items`Jurassic Parka` }));
      cliExecute("parka dilophosaur");
      const macro = Macro.if_(embezzler, Macro.meatKill())
        .familiarActions()
        .skill($skill`Spit jurassic acid`);
      adventureMacroAuto(location, macro);
      return have($effect`Everything Looks Yellow`);
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Map for Pills",
    available: () =>
      globalOptions.ascending &&
      clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) <=
        availableAmount($item`Map to Safety Shelter Grimace Prime`),
    execute: () => {
      const choiceToSet =
        availableAmount($item`distention pill`) <
        availableAmount($item`synthetic dog hair pill`) +
          availableAmount($item`Map to Safety Shelter Grimace Prime`)
          ? 1
          : 2;
      setChoice(536, choiceToSet);
      ensureEffect($effect`Transpondent`);
      use($item`Map to Safety Shelter Grimace Prime`);
      return true;
    },
    spendsTurn: true,
    sobriety: Sobriety.DRUNK,
  },
  {
    name: "Barf",
    available: () => true,
    execute: () => {
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
      return true;
    },
    spendsTurn: true,
    sobriety: Sobriety.EITHER,
  },
];

export default function barfTurn(): void {
  if (SourceTerminal.have()) SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);

  tryFillLatte();
  meatMood().execute(estimatedTurns());
  safeRestore();

  const isSober = myInebriety() <= inebrietyLimit();
  const validSobrieties = [Sobriety.EITHER, isSober ? Sobriety.SOBER : Sobriety.DRUNK];
  for (const turn of turns) {
    if (turn.available() && validSobrieties.includes(turn.sobriety)) {
      const expectToSpendATurn =
        typeof turn.spendsTurn === "function" ? turn.spendsTurn() : turn.spendsTurn;

      print(`Now running barf-turn: ${turn.name}.`);

      const startTurns = totalTurnsPlayed();
      const success = turn.execute();
      const spentATurn = totalTurnsPlayed() - startTurns === 1;

      if (!success) {
        print(`We expected to do ${turn.name}, but failed!`, "red");
      }
      if (!expectToSpendATurn && spentATurn) {
        print(`We unexpectedly spent a turn doing ${turn.name}!`, "red");
      }
      if (success) {
        const foughtAnEmbezzler = get("lastEncounter") === "Knob Goblin Embezzler";
        if (spentATurn && foughtAnEmbezzler) logEmbezzler(turn.name);

        const needTurns =
          myAdventures() === 1 + globalOptions.saveTurns && myInebriety() <= inebrietyLimit();
        if (needTurns) generateTurnsAtEndOfDay();
        return;
      }
    }
  }
  throw new Error("Somehow failed to find anything to do!");
}

function generateTurnsAtEndOfDay(): void {
  deliverThesisIfAble();

  if (
    have($item`Kramco Sausage-o-Matic™`) &&
    (have($item`magical sausage`) || have($item`magical sausage casing`)) &&
    get("_sausagesEaten") < 23
  ) {
    const available = clamp(
      23 - get("_sausagesEaten"),
      0,
      itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`)
    );
    eat(available, $item`magical sausage`);
  }

  if (
    have($item`designer sweatpants`) &&
    myAdventures() === 1 + globalOptions.saveTurns &&
    !globalOptions.noDiet
  ) {
    while (get("_sweatOutSomeBoozeUsed", 0) < 3 && get("sweat", 0) >= 25 && myInebriety() > 0) {
      useSkill($skill`Sweat Out Some Booze`);
    }
    consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
  }
}
