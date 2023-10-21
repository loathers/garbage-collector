import {
  availableAmount,
  canAdventure,
  canEquip,
  eat,
  Location,
  mallPrice,
  maximize,
  myAdventures,
  myInebriety,
  myLevel,
  myTurncount,
  runChoice,
  totalTurnsPlayed,
  toUrl,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  clamp,
  Counter,
  Delayed,
  ensureEffect,
  get,
  getModifier,
  have,
  questStep,
  SourceTerminal,
  sum,
  undelay,
} from "libram";
import { OutfitSpec, Quest } from "grimoire-kolmafia";
import { WanderDetails } from "garbo-lib";

import { GarboStrategy, Macro } from "../combat";
import { globalOptions } from "../config";
import { wanderer } from "../garboWanderer";
import {
  embezzler,
  EMBEZZLER_MULTIPLIER,
  howManySausagesCouldIEat,
  kramcoGuaranteed,
  romanticMonsterImpossible,
  sober,
} from "../lib";
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
import { deliverThesisIfAble } from "../fights";
import { computeDiet, consumeDiet } from "../diet";

import { GarboTask } from "./engine";
import { completeBarfQuest } from "../resources/realm";
import { garboValue } from "../garboValue";

const steveAdventures: Map<Location, number[]> = new Map([
  [$location`The Haunted Bedroom`, [1, 3, 1]],
  [$location`The Haunted Nursery`, [1, 2, 2, 1, 1]],
  [$location`The Haunted Conservatory`, [1, 2, 2]],
  [$location`The Haunted Billiards Room`, [1, 2, 2]],
  [$location`The Haunted Wine Cellar`, [1, 2, 2, 3]],
  [$location`The Haunted Boiler Room`, [1, 2, 2]],
  [$location`The Haunted Laboratory`, [1, 1, 3, 1, 1]],
]);

const canDuplicate = () =>
  SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;
const digitizedEmbezzler = () =>
  SourceTerminal.have() && SourceTerminal.getDigitizeMonster() === embezzler;

const isGhost = () => get("_voteMonster") === $monster`angry ghost`;
const isMutant = () => get("_voteMonster") === $monster`terrible mutant`;
const isSteve = () =>
  get("nextSpookyravenStephenRoom") === $location`The Haunted Laboratory`;

function wanderTask(
  details: Delayed<WanderDetails>,
  spec: Delayed<OutfitSpec>,
  base: Omit<GarboTask, "outfit" | "do" | "choices" | "spendsTurn"> & {
    combat?: GarboStrategy;
  },
): GarboTask {
  return {
    do: () => wanderer().getTarget(undelay(details)),
    choices: () => wanderer().getChoices(undelay(details)),
    outfit: () =>
      freeFightOutfit(undelay(spec), { wanderOptions: undelay(details) }),
    spendsTurn: false,
    combat: new GarboStrategy(() => Macro.basicCombat()),
    ...base,
  };
}

function canContinue(): boolean {
  return (
    myAdventures() > globalOptions.saveTurns &&
    (globalOptions.stopTurncount === null ||
      myTurncount() < globalOptions.stopTurncount)
  );
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

  if (
    have($item`envyfish egg`) ||
    (globalOptions.ascend && get("_envyfishEggUsed"))
  ) {
    return false;
  }
  if (!canAdventure($location`The Briny Deeps`)) return false;

  // TODO: if you didn't digitize an embezzler, this equation may not be right
  if (
    mallPrice($item`pulled green taffy`) <
    EMBEZZLER_MULTIPLIER() * get("valueOfAdventure")
  ) {
    return false;
  }

  if (have($effect`Fishy`)) return true;
  if (have($item`fishy pipe`) && !get("_fishyPipeUsed")) {
    use($item`fishy pipe`);
    return have($effect`Fishy`);
  }
  return false;
}

const TurnGenTasks: GarboTask[] = [
  {
    name: "Sausage",
    ready: () => myAdventures() <= 1 + globalOptions.saveTurns,
    completed: () => howManySausagesCouldIEat() === 0,
    prepare: () => maximize("MP", false),
    do: () => eat(howManySausagesCouldIEat(), $item`magical sausage`),
    spendsTurn: false,
  },
  {
    name: "Sweatpants",
    ready: () =>
      !globalOptions.nodiet &&
      have($item`designer sweatpants`) &&
      myAdventures() <= 1 + globalOptions.saveTurns,
    completed: () => get("_sweatOutSomeBoozeUsed") === 3,
    do: () => {
      while (
        get("_sweatOutSomeBoozeUsed") < 3 &&
        get("sweat") >= 25 &&
        myInebriety() > 0
      ) {
        useSkill($skill`Sweat Out Some Booze`);
      }
      consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
    },
    spendsTurn: false,
  },
];

type AlternateTask = GarboTask & { turns: Delayed<number> };

function dailyDungeon(additionalReady: () => boolean) {
  return {
    completed: () => get("dailyDungeonDone"),
    ready: () =>
      additionalReady() &&
      garboValue($item`fat loot token`) >
        get("valueOfAdventure") *
          clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    choices: () => ({ 689: 1, 690: 2, 691: 2, 692: 2, 693: 2 }),
    acquire:
      $items`ring of Detect Boring Doors, eleven-foot pole, Pick-O-Matic lockpicks`.map(
        (i) => ({ item: i }),
      ),
    do: $location`The Daily Dungeon`,
    combat: new GarboStrategy(Macro.kill()),
    turns: () => clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    spendsTurn: true,
  };
}

function willDrunkAdventure() {
  return have($item`Drunkula's wineglass`) && globalOptions.ascend;
}

const NonBarfTurnTasks: AlternateTask[] = [
  {
    name: "Daily Dungeon (drunk)",
    ...dailyDungeon(() => willDrunkAdventure()),
    outfit: () =>
      freeFightOutfit({
        offhand: $item`Drunkula's wineglass`,
        equip: $items`ring of Detect Boring Doors`,
      }),
    sobriety: "drunk",
  },
  {
    name: "Daily Dungeon (sober)",
    ...dailyDungeon(() => !willDrunkAdventure()),
    outfit: () =>
      freeFightOutfit({
        equip: $items`ring of Detect Boring Doors`,
      }),
    sobriety: "sober",
  },
  {
    name: "Map for Pills",
    completed: () =>
      availableAmount($item`Map to Safety Shelter Grimace Prime`) === 0,
    choices: () => ({
      536:
        availableAmount($item`distention pill`) <
        availableAmount($item`synthetic dog hair pill`) +
          availableAmount($item`Map to Safety Shelter Grimace Prime`)
          ? 1
          : 2,
    }),
    do: () => {
      ensureEffect($effect`Transpondent`);
      use($item`Map to Safety Shelter Grimace Prime`);
      return true;
    },
    spendsTurn: true,
    sobriety: "drunk",
    turns: () => availableAmount($item`Map to Safety Shelter Grimace Prime`),
  },
];

const BarfTurnTasks: GarboTask[] = [
  {
    name: "Latte",
    completed: () => latteFilled(),
    do: () => tryFillLatte(),
    spendsTurn: false,
  },
  {
    name: "Lights Out",
    ready: () =>
      canAdventure(get("nextSpookyravenStephenRoom") ?? $location`none`) &&
      get("nextSpookyravenStephenRoom") !== get("ghostLocation") &&
      totalTurnsPlayed() % 37 === 0,
    completed: () => totalTurnsPlayed() === get("lastLightsOutTurn"),
    do: () => {
      const steveRoom = get("nextSpookyravenStephenRoom");
      if (steveRoom && canAdventure(steveRoom)) {
        const plan = steveAdventures.get(steveRoom);
        if (plan) {
          visitUrl(toUrl(steveRoom));
          for (const choiceValue of plan) {
            runChoice(choiceValue);
          }
        }
      }
    },
    outfit: () =>
      embezzlerOutfit(sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    spendsTurn: isSteve,
    combat: new GarboStrategy(() =>
      Macro.if_(
        $monster`Stephen Spookyraven`,
        Macro.basicCombat(),
      ).abortWithMsg("Expected to fight Stephen Spookyraven, but didn't!"),
    ),
  },
  {
    name: "Proton Ghost",
    ready: () =>
      have($item`protonic accelerator pack`) && !!get("ghostLocation"),
    completed: () => get("questPAGhost") === "unstarted",
    do: () => get("ghostLocation") as Location,
    outfit: () =>
      freeFightOutfit({
        modifier:
          get("ghostLocation") === $location`The Icy Peak`
            ? ["Cold Resistance 5 min"]
            : [],
        back: $item`protonic accelerator pack`,
      }),
    combat: new GarboStrategy(() => Macro.ghostBustin()),
    spendsTurn: false,
    // Ghost fights are currently hard
    // and they resist physical attacks!
    sobriety: "sober",
  },
  wanderTask(
    () => ({ wanderer: "wanderer", drunkSafe: !isGhost() }),
    () => ({
      equip: [
        $item`"I Voted!" sticker`,
        ...(!sober() && !isGhost() ? $items`Drunkula's wineglass` : []),
        ...(!have($item`mutant crown`) && isMutant()
          ? $items`mutant arm, mutant legs`.filter((i) => have(i))
          : []),
      ],
    }),
    {
      name: "Vote Wanderer",
      ready: () =>
        have($item`"I Voted!" sticker`) &&
        totalTurnsPlayed() % 11 === 1 &&
        get("_voteFreeFights") < 3,
      completed: () => get("lastVoteMonsterTurn") >= totalTurnsPlayed(),
      sobriety: () => (isGhost() ? "sober" : undefined),
    },
  ),
  {
    name: "Thesis",
    ready: () =>
      have($familiar`Pocket Professor`) &&
      myAdventures() === 1 + globalOptions.saveTurns &&
      $familiar`Pocket Professor`.experience >= 400,
    completed: () => get("_thesisDelivered"),
    do: () => deliverThesisIfAble(),
    sobriety: "sober",
    spendsTurn: true,
  },
  {
    name: "Digitize Wanderer",
    completed: () => Counter.get("Digitize Monster") > 0,
    acquire: () =>
      SourceTerminal.getDigitizeMonster() === embezzler && shouldGoUnderwater()
        ? [{ item: $item`pulled green taffy` }]
        : [],
    outfit: () =>
      digitizedEmbezzler()
        ? embezzlerOutfit(
            {},
            wanderer().getTarget({
              wanderer: "wanderer",
              allowEquipment: false,
            }),
          )
        : freeFightOutfit(),
    do: () =>
      shouldGoUnderwater()
        ? $location`The Briny Deeps`
        : wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false }),
    choices: shouldGoUnderwater()
      ? {}
      : wanderer().getChoices({ wanderer: "wanderer", allowEquipment: false }),
    combat: new GarboStrategy(
      () =>
        Macro.externalIf(
          shouldGoUnderwater(),
          Macro.item($item`pulled green taffy`),
        ).meatKill(),
      Macro.if_(
        `(monsterid ${embezzler.id}) && !gotjump && !(pastround 2)`,
        Macro.externalIf(
          shouldGoUnderwater(),
          Macro.item($item`pulled green taffy`),
        ).meatKill(),
      ).abortWithMsg(
        `Expected a digitized ${SourceTerminal.getDigitizeMonster()}, but encountered something else.`,
      ),
    ),
    spendsTurn: () =>
      !SourceTerminal.getDigitizeMonster()?.attributes.includes("FREE"),
  },
  wanderTask(
    "wanderer",
    {
      offhand: $item`Kramco Sausage-o-Matic™`,
    },
    {
      name: "Guaranteed Kramco",
      ready: () => romanticMonsterImpossible(),
      completed: () => !kramcoGuaranteed(),
    },
  ),
  wanderTask(
    "wanderer",
    {
      offhand: $item`cursed magnifying glass`,
    },
    {
      name: "Void Monster",
      ready: () =>
        have($item`cursed magnifying glass`) && get("_voidFreeFights") < 5,
      completed: () => get("cursedMagnifyingGlassCount") !== 13,
    },
  ),
  {
    name: "Envyfish Egg",
    ready: () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler,
    completed: () => get("_envyfishEggUsed"),
    do: () => use($item`envyfish egg`),
    spendsTurn: true,
    outfit: embezzlerOutfit,
    combat: new GarboStrategy(() => Macro.embezzler()),
  },
  wanderTask(
    "yellow ray",
    {},
    {
      name: "Cheese Wizard Fondeluge",
      ready: () => have($skill`Fondeluge`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Yellow`),
      combat: new GarboStrategy(() =>
        Macro.if_(embezzler, Macro.meatKill())
          .familiarActions()
          .externalIf(canDuplicate(), Macro.trySkill($skill`Duplicate`))
          .skill($skill`Fondeluge`),
      ),
      duplicate: true,
      sobriety: "sober",
    },
  ),
  wanderTask(
    "yellow ray",
    { shirt: $items`Jurassic Parka`, modes: { parka: "dilophosaur" } },
    {
      name: "Spit Acid",
      ready: () => have($item`Jurassic Parka`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Yellow`),
      combat: new GarboStrategy(() =>
        Macro.if_(embezzler, Macro.meatKill())
          .familiarActions()
          .externalIf(canDuplicate(), Macro.trySkill($skill`Duplicate`))
          .skill($skill`Spit jurassic acid`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "freefight",
    {},
    {
      name: "Pig Skinner Free-For-All",
      ready: () => have($skill`Free-For-All`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Red`),
      combat: new GarboStrategy(() =>
        Macro.if_(embezzler, Macro.meatKill())
          .familiarActions()
          .externalIf(canDuplicate(), Macro.trySkill($skill`Duplicate`))
          .skill($skill`Free-For-All`),
      ),
      duplicate: true,
    },
  ),
  wanderTask(
    "yellow ray",
    {},
    {
      name: "Shocking Lick",
      ready: () => romanticMonsterImpossible(),
      completed: () => get("shockingLickCharges") === 0,
      combat: new GarboStrategy(() =>
        Macro.if_(embezzler, Macro.meatKill())
          .familiarActions()
          .externalIf(canDuplicate(), Macro.trySkill($skill`Duplicate`))
          .skill($skill`Shocking Lick`),
      ),
      duplicate: true,
      sobriety: "sober",
    },
  ),
];

function nonBarfTurns(): number {
  const sobriety = sober() ? "sober" : "drunk";
  return sum(
    NonBarfTurnTasks.filter(
      (t) => (undelay(t.sobriety) ?? sobriety) === sobriety,
    ),
    (t) => undelay(t.turns),
  );
}

export const TurnGenQuest: Quest<GarboTask> = {
  name: "Turn Gen",
  tasks: TurnGenTasks,
};

export const WandererQuest: Quest<GarboTask> = {
  name: "Wanderers",
  tasks: BarfTurnTasks,
  completed: () => !canContinue(),
};

export const NonBarfTurnQuest: Quest<GarboTask> = {
  name: "Non Barf Turn",
  tasks: NonBarfTurnTasks,
  completed: () =>
    !canContinue() ||
    clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) >=
      nonBarfTurns(),
};

export const BarfTurnQuest: Quest<GarboTask> = {
  name: "Barf Turn",
  tasks: [
    {
      name: "Barf",
      completed: () => myAdventures() === 0,
      outfit: () => {
        const lubing =
          get("dinseyRollercoasterNext") && have($item`lube-shoes`);
        return barfOutfit(lubing ? { equip: $items`lube-shoes` } : {});
      },
      do: $location`Barf Mountain`,
      combat: new GarboStrategy(
        () => Macro.meatKill(),
        () =>
          Macro.if_(
            `(monsterid ${embezzler.id}) && !gotjump && !(pastround 2)`,
            Macro.meatKill(),
          ).abort(),
      ),
      post: () => completeBarfQuest(),
      spendsTurn: true,
    },
  ],
  completed: () => !canContinue(),
};

export const BarfTurnQuests = [
  TurnGenQuest,
  WandererQuest,
  NonBarfTurnQuest,
  BarfTurnQuest,
];
