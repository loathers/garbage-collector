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
  questStep,
  SourceTerminal,
} from "libram";
import { garboAdventure, garboAdventureAuto, Macro, withMacro } from "../combat";
import { globalOptions } from "../config";
import { embezzler } from "../embezzler/lib";
import { wanderer } from "../garboWanderer";
import {
  EMBEZZLER_MULTIPLIER,
  howManySausagesCouldIEat,
  kramcoGuaranteed,
  propertyManager,
  romanticMonsterImpossible,
  setChoice,
  sober,
} from "../lib";
import { WanderOptions } from "../libgarbo";
import {
  barfOutfit,
  embezzlerOutfit,
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  latteFilled,
  tryFillLatte,
  waterBreathingEquipment,
} from "../outfit";
import { digitizedMonstersRemaining } from "../turns";
import { completeBarfQuest } from "./daily";
import { GarboTask } from "./engine";
import { Quest } from "grimoire-kolmafia";
import { deliverThesisIfAble } from "../fights";
import { computeDiet, consumeDiet } from "../diet";

const steveAdventures: Map<Location, number[]> = new Map([
  [$location`The Haunted Bedroom`, [1, 3, 1]],
  [$location`The Haunted Nursery`, [1, 2, 2, 1, 1]],
  [$location`The Haunted Conservatory`, [1, 2, 2]],
  [$location`The Haunted Billiards Room`, [1, 2, 2]],
  [$location`The Haunted Wine Cellar`, [1, 2, 2, 3]],
  [$location`The Haunted Boiler Room`, [1, 2, 2]],
  [$location`The Haunted Laboratory`, [1, 1, 3, 1, 1]],
]);

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

const BarfTurnTasks: GarboTask[] = [
  {
    name: "Latte",
    completed: () => latteFilled(),
    do: () => tryFillLatte(),
    spendsTurn: false,
  },
  {
    name: "Generate End of Day Turns",
    completed: () => myAdventures() > 1 + globalOptions.saveTurns,
    do: () => {
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
    },
    sobriety: "sober",
    spendsTurn: true,
  },
  {
    name: "Lights Out",
    ready: () =>
      canAdventure(get("nextSpookyravenStephenRoom") ?? $location`none`) &&
      totalTurnsPlayed() % 37 === 0,
    completed: () => totalTurnsPlayed() === get("lastLightsOutTurn"),
    do: () => {
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
  },
  {
    name: "Proton Ghost",
    ready: () => have($item`protonic accelerator pack`) && !!get("ghostLocation"),
    completed: () => get("questPAGhost") === "unstarted",
    do: () => {
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
    sobriety: "sober",
  },
  {
    name: "Vote Wanderer",
    ready: () =>
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("_voteFreeFights") < 3,
    completed: () => get("lastVoteMonsterTurn") >= totalTurnsPlayed(),
    do: () => {
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
  },
  {
    name: "Digitize Wanderer",
    completed: () => Counter.get("Digitize Monster") > 0,
    do: () => {
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
  },
  {
    name: "Guaranteed Kramco",
    ready: () => romanticMonsterImpossible(),
    completed: () => !kramcoGuaranteed(),
    do: () => {
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
  },
  {
    name: "Void Monster",
    ready: () => have($item`cursed magnifying glass`) && get("_voidFreeFights") < 5,
    completed: () => get("cursedMagnifyingGlassCount") !== 13,
    do: () => {
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
  },
  {
    name: "Envyfish Egg",
    ready: () => have($item`envyfish egg`) && get("envyfishMonster") === embezzler,
    completed: () => get("_envyfishEggUsed"),
    do: () => {
      embezzlerOutfit().dress();
      withMacro(Macro.meatKill(), () => use($item`envyfish egg`), true);
      return get("_envyfishEggUsed");
    },
    spendsTurn: true,
  },
  {
    name: "Cheese Wizard Fondeluge",
    ready: () => have($skill`Fondeluge`) && romanticMonsterImpossible(),
    completed: () => have($effect`Everything Looks Yellow`),
    do: () => {
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
    sobriety: "sober",
  },
  {
    name: "Spit Acid",
    ready: () => have($item`Jurassic Parka`) && romanticMonsterImpossible(),
    completed: () => have($effect`Everything Looks Yellow`),
    do: () => {
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
    sobriety: "sober",
  },
  {
    name: "Pig Skinner Free-For-All",
    ready: () => have($skill`Free-For-All`) && romanticMonsterImpossible(),
    completed: () => have($effect`Everything Looks Red`),
    do: () => {
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
    sobriety: "sober",
  },
  {
    name: "Shocking Lick",
    ready: () => romanticMonsterImpossible(),
    completed: () => get("shockingLickCharges") === 0,
    do: () => {
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
    sobriety: "sober",
  },
  {
    name: "Map for Pills",
    ready: () =>
      globalOptions.ascend &&
      clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) <=
        availableAmount($item`Map to Safety Shelter Grimace Prime`),
    completed: () => false,
    do: () => {
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
    sobriety: "drunk",
  },
  {
    name: "Barf",
    completed: () => false,
    do: () => {
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
  },
];

export const BarfTurnQuest: Quest<GarboTask> = {
  name: "Barf Turn",
  tasks: BarfTurnTasks,
};
