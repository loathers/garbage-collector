import {
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  currentRound,
  eat,
  Location,
  mallPrice,
  maximize,
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
  clamp,
  Counter,
  ensureEffect,
  get,
  getModifier,
  have,
  SourceTerminal,
} from "libram";
import { garboAdventure, garboAdventureAuto, Macro, withMacro } from "./combat";
import { globalOptions } from "./config";
import { computeDiet, consumeDiet } from "./diet";
import { deliverThesisIfAble } from "./fights";
import {
  EMBEZZLER_MULTIPLIER,
  eventLog,
  howManySausagesCouldIEat,
  kramcoGuaranteed,
  propertyManager,
  questStep,
  romanticMonsterImpossible,
  safeRestore,
  setChoice,
  sober,
} from "./lib";
import { meatMood } from "./mood";
import {
  barfOutfit,
  embezzlerOutfit,
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  tryFillLatte,
  waterBreathingEquipment,
} from "./outfit";
import postCombatActions from "./post";
import { trackBarfSessionStatistics } from "./session";
import { completeBarfQuest } from "./tasks/daily";
import { digitizedMonstersRemaining, estimatedGarboTurns } from "./turns";
import { WanderOptions } from "./wanderer";
import { wanderer } from "./garboWanderer";

const embezzler = $monster`Knob Goblin Embezzler`;

function logEmbezzler(encounterType: string) {
  const isDigitize = encounterType === "Digitize Wanderer";
  isDigitize ? eventLog.digitizedEmbezzlersFought++ : eventLog.initialEmbezzlersFought++;
  eventLog.embezzlerSources.push(isDigitize ? "Digitize" : "Unknown Source");
}

function shouldGoUnderwater(): boolean {
  if (!sober()) return false;
  if (myLevel() < 11) return false;

  if (questStep("questS01OldGuy") === -1) {
    visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
  }

  if (
    !getModifier("Adventure Underwater") &&
    waterBreathingEquipment.every((item) => !have(item) || !canEquip(item))
  ) {
    return false;
  }
  if (
    !getModifier("Underwater Familiar") &&
    familiarWaterBreathingEquipment.every((item) => !have(item))
  ) {
    return false;
  }

  if (have($item`envyfish egg`) || (globalOptions.ascend && get("_envyfishEggUsed"))) return false;
  if (!canAdventure($location`The Briny Deeps`)) return false;
  if (mallPrice($item`pulled green taffy`) < EMBEZZLER_MULTIPLIER() * get("valueOfAdventure")) {
    return false;
  }

  if (have($effect`Fishy`)) return true;
  if (have($item`fishy pipe`) && !get("_fishyPipeUsed")) {
    use($item`fishy pipe`);
    return have($effect`Fishy`);
  }
  return false;
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
        const drunkSpec = sober() ? {} : { offhand: $item`Drunkula's wineglass` };
        if (fightingSteve) embezzlerOutfit(drunkSpec).dress();
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
            true,
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
      const modifier = ghostLocation === $location`The Icy Peak` ? ["Cold Resistance 5 min"] : [];
      freeFightOutfit({ modifier, back: $item`protonic accelerator pack` }).dress();

      garboAdventure(ghostLocation, Macro.ghostBustin());
      return get("questPAGhost") === "unstarted";
    },
    spendsTurn: false,
    // Ghost fights are currently hard
    // and they resist physical attacks!
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
      const isGhost = get("_voteMonster") === $monster`angry ghost`;
      const isMutant = get("_voteMonster") === $monster`terrible mutant`;
      const wanderOptions: WanderOptions = { wanderer: "wanderer", drunkSafe: !isGhost };

      freeFightOutfit(
        {
          equip: [
            $item`"I Voted!" sticker`,
            ...(!sober() && !isGhost ? $items`Drunkula's wineglass` : []),
            ...(!have($item`mutant crown`) && isMutant
              ? $items`mutant arm, mutant legs`.filter((i) => have(i))
              : []),
          ],
        },
        { wanderOptions },
      ).dress();
      propertyManager.setChoices(wanderer().getChoices(wanderOptions));
      garboAdventureAuto(wanderer().getTarget(wanderOptions), Macro.basicCombat());
      return get("lastVoteMonsterTurn") === totalTurnsPlayed();
    },
    spendsTurn: false,
    sobriety: Sobriety.EITHER,
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
        : wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false });

      if (underwater) retrieveItem($item`pulled green taffy`);
      else propertyManager.setChoices(wanderer().getChoices("wanderer"));

      isEmbezzler ? embezzlerOutfit({}, targetLocation).dress() : freeFightOutfit().dress();
      garboAdventureAuto(
        targetLocation,
        Macro.externalIf(underwater, Macro.item($item`pulled green taffy`)).meatKill(),

        // Hacky fix for when we fail init to embezzler, who are special monsters
        // Macro autoattacks fail when you lose the jump to special monsters
        Macro.if_(
          `(monsterid ${embezzler.id}) && !gotjump && !(pastround 2)`,
          Macro.externalIf(underwater, Macro.item($item`pulled green taffy`)).meatKill(),
        ).abortWithMsg(
          `Expected a digitized ${SourceTerminal.getDigitizeMonster()}, but encountered something else.`,
        ),
      );
      return get("_sourceTerminalDigitizeMonsterCount") !== start;
    },
    spendsTurn: () => !SourceTerminal.getDigitizeMonster()?.attributes.includes("FREE"),
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Guaranteed Kramco",
    available: () => kramcoGuaranteed() && romanticMonsterImpossible(),
    execute: () => {
      freeFightOutfit(
        {
          offhand: $item`Kramco Sausage-o-Matic™`,
        },
        { wanderOptions: "wanderer" },
      ).dress();
      propertyManager.setChoices(wanderer().getChoices("wanderer"));
      garboAdventureAuto(wanderer().getTarget("wanderer"), Macro.basicCombat());
      return !kramcoGuaranteed();
    },
    spendsTurn: false,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Void Monster",
    available: () =>
      have($item`cursed magnifying glass`) &&
      get("cursedMagnifyingGlassCount") === 13 &&
      get("_voidFreeFights") < 5,
    execute: () => {
      freeFightOutfit(
        {
          offhand: $item`cursed magnifying glass`,
        },
        { wanderOptions: "wanderer" },
      ).dress();
      propertyManager.setChoices(wanderer().getChoices("wanderer"));
      garboAdventureAuto(wanderer().getTarget("wanderer"), Macro.basicCombat());
      return get("cursedMagnifyingGlassCount") === 0;
    },
    spendsTurn: false,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Envyfish Egg",
    available: () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed"),
    execute: () => {
      embezzlerOutfit().dress();
      withMacro(Macro.meatKill(), () => use($item`envyfish egg`), true);
      return get("_envyfishEggUsed");
    },
    spendsTurn: true,
    sobriety: Sobriety.EITHER,
  },
  {
    name: "Cheese Wizard Fondeluge",
    available: () =>
      have($skill`Fondeluge`) &&
      !have($effect`Everything Looks Yellow`) &&
      romanticMonsterImpossible(),
    execute: () => {
      const usingDuplicate = SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;

      propertyManager.setChoices(wanderer().getChoices("yellow ray"));
      const location = wanderer().getTarget("yellow ray");
      freeFightOutfit(
        {},
        { location, allowAttackFamiliars: !usingDuplicate, wanderOptions: "yellow ray" },
      ).dress();
      if (usingDuplicate) {
        SourceTerminal.educate([$skill`Extract`, $skill`Duplicate`]);
      }
      const macro = Macro.if_(embezzler, Macro.meatKill())
        .familiarActions()
        .externalIf(usingDuplicate, Macro.trySkill($skill`Duplicate`))
        .skill($skill`Fondeluge`);
      garboAdventureAuto(location, macro);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
      }
      return have($effect`Everything Looks Yellow`);
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Spit Acid",
    available: () =>
      have($item`Jurassic Parka`) &&
      !have($effect`Everything Looks Yellow`) &&
      romanticMonsterImpossible(),
    execute: () => {
      const usingDuplicate = SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;

      propertyManager.setChoices(wanderer().getChoices("yellow ray"));
      const location = wanderer().getTarget("yellow ray");
      freeFightOutfit(
        { shirt: $items`Jurassic Parka` },
        { location, allowAttackFamiliars: !usingDuplicate, wanderOptions: "yellow ray" },
      ).dress();
      cliExecute("parka dilophosaur");
      if (usingDuplicate) {
        SourceTerminal.educate([$skill`Extract`, $skill`Duplicate`]);
      }
      const macro = Macro.if_(embezzler, Macro.meatKill())
        .familiarActions()
        .externalIf(usingDuplicate, Macro.trySkill($skill`Duplicate`))
        .skill($skill`Spit jurassic acid`);
      garboAdventureAuto(location, macro);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
      }
      return have($effect`Everything Looks Yellow`);
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Pig Skinner Free-For-All",
    available: () =>
      have($skill`Free-For-All`) &&
      !have($effect`Everything Looks Red`) &&
      romanticMonsterImpossible(),
    execute: () => {
      propertyManager.setChoices(wanderer().getChoices("freefight"));
      const location = wanderer().getTarget("freefight");
      freeFightOutfit({}, { location, wanderOptions: "freefight" }).dress();
      const macro = Macro.if_(embezzler, Macro.meatKill())
        .familiarActions()
        .skill($skill`Free-For-All`);
      garboAdventureAuto(location, macro);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
      }
      return have($effect`Everything Looks Red`);
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Shocking Lick",
    available: () => get("shockingLickCharges") > 0 && romanticMonsterImpossible(),
    execute: () => {
      const curLicks = get("shockingLickCharges");
      const usingDuplicate = SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;

      propertyManager.setChoices(wanderer().getChoices("yellow ray"));
      const location = wanderer().getTarget("yellow ray");
      if (usingDuplicate) {
        SourceTerminal.educate([$skill`Extract`, $skill`Duplicate`]);
      }

      freeFightOutfit(
        {},
        { location, allowAttackFamiliars: !usingDuplicate, wanderOptions: "yellow ray" },
      ).dress();
      const macro = Macro.if_(embezzler, Macro.meatKill())
        .familiarActions()
        .externalIf(usingDuplicate, Macro.trySkill($skill`Duplicate`))
        .skill($skill`Shocking Lick`);
      garboAdventureAuto(location, macro);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
      }
      return get("shockingLickCharges") === curLicks - 1;
    },
    spendsTurn: false,
    sobriety: Sobriety.SOBER,
  },
  {
    name: "Map for Pills",
    available: () =>
      globalOptions.ascend &&
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
      const lubing = get("dinseyRollercoasterNext") && have($item`lube-shoes`);
      barfOutfit(lubing ? { equip: $items`lube-shoes` } : {}).dress();
      garboAdventureAuto(
        $location`Barf Mountain`,
        Macro.meatKill(),
        Macro.if_(
          `(monsterid ${$monster`Knob Goblin Embezzler`.id}) && !gotjump && !(pastround 2)`,
          Macro.meatKill(),
        ).abort(),
      );
      completeBarfQuest();
      return true;
    },
    spendsTurn: true,
    sobriety: Sobriety.EITHER,
  },
];

function runTurn() {
  const validSobrieties = [Sobriety.EITHER, sober() ? Sobriety.SOBER : Sobriety.DRUNK];
  const turn = turns.find((t) => t.available() && validSobrieties.includes(t.sobriety));
  if (!turn) throw new Error("Somehow failed to find anything to do!");
  const expectToSpendATurn =
    typeof turn.spendsTurn === "function" ? turn.spendsTurn() : turn.spendsTurn;
  print(`Now running barf-turn: ${turn.name}.`);

  const startTurns = totalTurnsPlayed();
  const success = turn.execute();
  const spentATurn = totalTurnsPlayed() - startTurns === 1;

  if (spentATurn) {
    if (!expectToSpendATurn) print(`We unexpectedly spent a turn doing ${turn.name}!`, "red");

    const foughtAnEmbezzler = get("lastEncounter") === "Knob Goblin Embezzler";
    if (foughtAnEmbezzler) logEmbezzler(turn.name);

    const needTurns = myAdventures() === 1 + globalOptions.saveTurns && sober();
    if (needTurns) generateTurnsAtEndOfDay();
  }

  return { success, spentATurn };
}

export default function barfTurn(): void {
  trackBarfSessionStatistics();
  if (SourceTerminal.have()) SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);

  tryFillLatte();
  meatMood().execute(estimatedGarboTurns());
  safeRestore();

  let failures = 0;
  while (failures < 3) {
    const { success, spentATurn } = runTurn();

    if (success) return;
    failures++;
    if (spentATurn) postCombatActions();
  }
  throw new Error("Tried thrice to adventure, and failed each time. Aborting.");
}

function generateTurnsAtEndOfDay(): void {
  deliverThesisIfAble();

  const sausages = howManySausagesCouldIEat();
  if (sausages > 0) {
    maximize("MP", false);
    eat(sausages, $item`magical sausage`);
  }

  if (
    have($item`designer sweatpants`) &&
    myAdventures() === 1 + globalOptions.saveTurns &&
    !globalOptions.nodiet
  ) {
    while (get("_sweatOutSomeBoozeUsed") < 3 && get("sweat") >= 25 && myInebriety() > 0) {
      useSkill($skill`Sweat Out Some Booze`);
    }
    consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
  }
}
