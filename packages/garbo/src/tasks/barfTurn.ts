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
  outfitPieces,
  runChoice,
  totalTurnsPlayed,
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
  AprilingBandHelmet,
  clamp,
  Counter,
  Delayed,
  ensureEffect,
  get,
  getModifier,
  GingerBread,
  have,
  questStep,
  realmAvailable,
  set,
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
  EMBEZZLER_MULTIPLIER,
  getBestLuckyAdventure,
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
  waterBreathingEquipment,
} from "../outfit";
import { digitizedMonstersRemaining } from "../turns";
import { deliverThesisIfAble } from "../fights";
import { computeDiet, consumeDiet } from "../diet";

import { GarboTask } from "./engine";
import { trackMarginalMpa } from "../session";
import { garboValue } from "../garboValue";
import {
  bestMidnightAvailable,
  completeBarfQuest,
  shouldFillLatte,
  tryFillLatte,
} from "../resources";
import { acquire } from "../acquire";

const canDuplicate = () =>
  SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;
const digitizedEmbezzler = () =>
  SourceTerminal.have() &&
  SourceTerminal.getDigitizeMonster() === globalOptions.target;

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
    choices: () => ({ 689: 1, 690: 2, 691: 2, 692: 3, 693: 2 }),
    acquire:
      $items`ring of Detect Boring Doors, eleven-foot pole, Pick-O-Matic lockpicks`.map(
        (i) => ({ item: i }),
      ),
    do: $location`The Daily Dungeon`,
    combat: new GarboStrategy(() => Macro.kill()),
    turns: () => clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    spendsTurn: true,
  };
}

function vampOut(additionalReady: () => boolean) {
  return {
    ready: () =>
      additionalReady() &&
      have($item`plastic vampire fangs`) &&
      garboValue($item`Interview With You (a Vampire)`) >
        get("valueOfAdventure"),
    completed: () => get("_interviewMasquerade"),
    choices: () => ({
      546: 12,
    }),
    do: () => {
      visitUrl("place.php?whichplace=town&action=town_vampout");
      runChoice(-1);
    },
    outfit: () =>
      freeFightOutfit({
        equip: $items`plastic vampire fangs`,
      }),
    spendsTurn: true,
    turns: () => (get("_interviewMasquerade") ? 0 : 1),
  };
}

function gingerbreadMidnight(additionalReady: () => boolean) {
  return {
    name: "Gingerbread Midnight",
    ready: additionalReady,
    completed: () => GingerBread.minutesToMidnight() !== 0,
    do: () => bestMidnightAvailable().location,
    choices: () => bestMidnightAvailable().choices,
    outfit: () => ({
      equip:
        bestMidnightAvailable().location ===
        $location`Gingerbread Upscale Retail District`
          ? outfitPieces("Gingerbread Best")
          : [],
      offhand: sober() ? undefined : $item`Drunkula's wineglass`,
    }),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "We thought it was Midnight here in Gingerbread City, but we're in a fight!",
      ),
    ),
    spendsTurn: true,
  };
}

function willDrunkAdventure() {
  return have($item`Drunkula's wineglass`) && globalOptions.ascend;
}

function canForceNoncombat() {
  return (
    get("noncombatForcerActive") ||
    (!get("_claraBellUsed") && have($item`Clara's bell`))
  );
}

function canGetFusedFuse() {
  return (
    realmAvailable("hot") &&
    ([1, 2, 3] as const).some(
      (it) => get(`_volcanoItem${it}`) === $item`fused fuse`.id,
    ) &&
    canForceNoncombat()
  );
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
    name: "Vamp Out (drunk)",
    ...vampOut(() => willDrunkAdventure()),
    sobriety: "drunk",
  },
  {
    name: "Vamp Out (sober)",
    ...vampOut(() => !willDrunkAdventure()),
    sobriety: "sober",
  },
  {
    ...gingerbreadMidnight(() => willDrunkAdventure()),
    name: "Gingerbread Midnight (drunk)",
    turns: () => (GingerBread.minutesToMidnight() === 0 ? 1 : 0),
  },
  {
    ...gingerbreadMidnight(() => !willDrunkAdventure()),
    name: "Gingerbread Midnight (sober)",
    turns: () => (GingerBread.minutesToMidnight() === 0 ? 1 : 0),
  },
  {
    name: "Fused Fuse",
    completed: () => get("_volcanoItemRedeemed"),
    ready: canGetFusedFuse,
    do: $location`LavaCo™ Lamp Factory`,
    prepare: () => get("noncombatForcerActive") || use($item`Clara's bell`),
    post: () => {
      visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
      const option = ([1, 2, 3] as const).find(
        (it) => get(`_volcanoItem${it}`) === $item`fused fuse`.id,
      );
      if (option) runChoice(option);
      visitUrl("main.php");
    },
    outfit: () => (sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () => (canGetFusedFuse() ? 1 : 0),
    spendsTurn: true,
    choices: { 1091: 7 },
  },
  {
    name: "Apriling Saxophone Lucky (drunk)",
    completed: () => !AprilingBandHelmet.canPlay("Apriling band saxophone"),
    ready: () =>
      globalOptions.ascend &&
      have($item`Apriling band saxophone`) &&
      getBestLuckyAdventure().location ===
        $location`The Castle in the Clouds in the Sky (Top Floor)` &&
      getBestLuckyAdventure().value() > get("valueOfAdventure"),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    prepare: () => {
      if (!have($effect`Lucky!`)) {
        AprilingBandHelmet.play($item`Apriling band saxophone`);
      }
    },
    outfit: () => (sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () =>
      have($item`Apriling band saxophone`)
        ? $item`Apriling band saxophone`.dailyusesleft
        : 0,
    sobriety: "drunk",
    spendsTurn: true,
  },
  {
    name: "Apriling Saxophone Lucky (sober)",
    completed: () => !AprilingBandHelmet.canPlay("Apriling band saxophone"),
    ready: () =>
      !globalOptions.ascend &&
      have($item`Apriling band saxophone`) &&
      getBestLuckyAdventure().location ===
        $location`The Castle in the Clouds in the Sky (Top Floor)` &&
      getBestLuckyAdventure().value() > get("valueOfAdventure"),
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    prepare: () => {
      if (!have($effect`Lucky!`)) {
        AprilingBandHelmet.play($item`Apriling band saxophone`);
      }
    },
    outfit: () => (sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () =>
      have($item`Apriling band saxophone`)
        ? $item`Apriling band saxophone`.dailyusesleft
        : 0,
    sobriety: "sober",
    spendsTurn: true,
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
  {
    name: "Use Day Shorteners (drunk)",
    ready: () =>
      globalOptions.ascend &&
      garboValue($item`extra time`) >
        mallPrice($item`day shortener`) + 5 * get("valueOfAdventure"),
    completed: () => get(`_garboDayShortenersUsed`, 0) >= 3, // Arbitrary cap at 3, since using 3 results in only 1 adventure
    do: () => {
      if (
        acquire(
          1,
          $item`day shortener`,
          garboValue($item`extra time`) - 5 * get("valueOfAdventure"),
          false,
        )
      ) {
        use($item`day shortener`);
      }
      set(`_garboDayShortenersUsed`, get(`_garboDayShortenersUsed`, 0) + 1);
    },
    spendsTurn: true,
    sobriety: "drunk",
    turns: () => 5 * (3 - get(`_garboDayShortenersUsed`, 0)),
  },
  {
    name: "Use Day Shorteners (sober)",
    ready: () =>
      !globalOptions.ascend &&
      garboValue($item`extra time`) >
        mallPrice($item`day shortener`) + 5 * get("valueOfAdventure"),
    completed: () => get(`_garboDayShortenersUsed`, 0) >= 3, // Arbitrary cap at 3, since using 3 results in only 1 adventure
    do: () => {
      if (
        acquire(
          1,
          $item`day shortener`,
          garboValue($item`extra time`) - 5 * get("valueOfAdventure"),
          false,
        )
      ) {
        use($item`day shortener`);
      }
      set(`_garboDayShortenersUsed`, get(`_garboDayShortenersUsed`, 0) + 1);
    },
    spendsTurn: true,
    sobriety: "sober",
    turns: () => 5 * (3 - get(`_garboDayShortenersUsed`, 0)),
  },
];

const BarfTurnTasks: GarboTask[] = [
  {
    name: "Latte",
    completed: () => !shouldFillLatte(),
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
    do: () => get("nextSpookyravenStephenRoom") as Location,
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
    name: "Digitize Wanderer (Underwater, for Green Taffy)",
    completed: () => Counter.get("Digitize Monster") > 0,
    ready: shouldGoUnderwater,
    acquire: () => [{ item: $item`pulled green taffy` }],
    do: $location`The Briny Deeps`,
    outfit: () => embezzlerOutfit({}, $location`The Briny Deeps`),
    combat: new GarboStrategy(
      () => Macro.item($item`pulled green taffy`).meatKill(),
      () =>
        Macro.if_(
          `(monsterid ${globalOptions.target.id}) && !gotjump && !(pastround 2)`,
          Macro.item($item`pulled green taffy`).meatKill(),
        ).abortWithMsg(
          `Expected a digitized ${SourceTerminal.getDigitizeMonster()}, but encountered something else.`,
        ),
    ),
    sobriety: "sober",
    spendsTurn: true,
  },
  {
    name: "Digitize Wanderer",
    completed: () => Counter.get("Digitize Monster") > 0,
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
      wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false }),
    choices: () =>
      wanderer().getChoices({
        wanderer: "wanderer",
        allowEquipment: false,
      }),
    combat: new GarboStrategy(
      () => Macro.meatKill(),
      () =>
        Macro.if_(
          `(monsterid ${globalOptions.target.id}) && !gotjump && !(pastround 2)`,
          Macro.meatKill(),
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
      have($item`envyfish egg`) &&
      get("envyfishMonster") === globalOptions.target,
    completed: () => get("_envyfishEggUsed"),
    do: () => use($item`envyfish egg`),
    spendsTurn: true,
    outfit: embezzlerOutfit,
    combat: new GarboStrategy(() => Macro.embezzler("envyfish egg")),
  },
  wanderTask(
    "yellow ray",
    {},
    {
      name: "Cheese Wizard Fondeluge",
      ready: () => have($skill`Fondeluge`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Yellow`),
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
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
        Macro.if_(globalOptions.target, Macro.meatKill())
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
        Macro.if_(globalOptions.target, Macro.meatKill())
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
        Macro.if_(globalOptions.target, Macro.meatKill())
          .familiarActions()
          .externalIf(canDuplicate(), Macro.trySkill($skill`Duplicate`))
          .skill($skill`Shocking Lick`),
      ),
      duplicate: true,
      sobriety: "sober",
    },
  ),
  {
    name: "Gingerbread Noon",
    completed: () => GingerBread.minutesToNoon() !== 0,
    do: $location`Gingerbread Train Station`,
    choices: { 1204: 1 },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "We thought it was noon here in Gingerbread City, but we're in a fight!",
      ),
    ),
    outfit: () => (sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    spendsTurn: true,
  },
  // If extra adventures are unlocked, we want to finish midnight to re-open the zone ASAP
  gingerbreadMidnight(() => get("gingerExtraAdventures")),
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
  ready: () =>
    clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) <=
    nonBarfTurns() + globalOptions.saveTurns,
  completed: () => !canContinue(),
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
            `(monsterid ${globalOptions.target.id}) && !gotjump && !(pastround 2)`,
            Macro.meatKill(),
          ).abort(),
      ),
      post: () => {
        completeBarfQuest();
        trackMarginalMpa();
      },
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
