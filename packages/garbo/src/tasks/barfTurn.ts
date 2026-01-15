import {
  adv1,
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  eat,
  getWorkshed,
  haveEquipped,
  inebrietyLimit,
  Item,
  itemAmount,
  Location,
  mallPrice,
  maximize,
  myAdventures,
  myAscensions,
  myInebriety,
  myLevel,
  myLightning,
  myLocation,
  myRain,
  myTurncount,
  outfitPieces,
  retrieveItem,
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
  ChestMimic,
  clamp,
  Counter,
  CrepeParachute,
  Delayed,
  DesignerSweatpants,
  ensureEffect,
  get,
  getModifier,
  GingerBread,
  have,
  HeavyRains,
  maxBy,
  PeridotOfPeril,
  questStep,
  realmAvailable,
  set,
  SourceTerminal,
  sum,
  TrainSet,
  undelay,
  withChoice,
  withProperty,
} from "libram";
import { getTasks, Outfit, OutfitSpec, Quest } from "grimoire-kolmafia";
import {
  canAdventureOrUnlock,
  getAvailableUltraRareZones,
  hasNameCollision,
  unperidotableZones,
  WanderDetails,
} from "garbo-lib";

import { getPreferredBarfMonster, Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import { wanderer } from "../garboWanderer";
import {
  getBestLuckyAdventure,
  howManySausagesCouldIEat,
  kramcoGuaranteed,
  MEAT_TARGET_MULTIPLIER,
  romanticMonsterImpossible,
  sober,
  targetingMeat,
  willDrunkAdventure,
} from "../lib";
import {
  barfOutfit,
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  FreeFightOutfitMenuOptions,
  meatTargetOutfit,
  waterBreathingEquipment,
} from "../outfit";
import { digitizedMonstersRemaining, estimatedGarboTurns } from "../turns";
import { deliverThesisIfAble } from "../fights";
import { computeDiet, consumeDiet } from "../diet";

import { AlternateTask, GarboTask } from "./engine";
import { trackMarginalMpa } from "../session";
import { garboValue } from "../garboValue";
import {
  bestMidnightAvailable,
  canBullseye,
  completeBarfQuest,
  guaranteedBullseye,
  mayamCalendarSummon,
  minimumMimicExperience,
  safeToAttemptBullseye,
  shouldAugustCast,
  shouldFillLatte,
  tryFillLatte,
  willYachtzee,
} from "../resources";
import { acquire } from "../acquire";
import { shouldMakeEgg } from "../resources";
import { lavaDogsAccessible, lavaDogsComplete } from "../resources/doghouse";
import { hotTubAvailable } from "../resources/clanVIP";
import { meatMood } from "../mood";
import { yachtzeeQuest } from "./yachtzee";

const digitizedTarget = () =>
  SourceTerminal.have() &&
  SourceTerminal.getDigitizeMonster() === globalOptions.target;

const isGhost = () => get("_voteMonster") === $monster`angry ghost`;
const isMutant = () => get("_voteMonster") === $monster`terrible mutant`;
const isSteve = () =>
  get("nextSpookyravenStephenRoom") === $location`The Haunted Laboratory`;

let lastParachuteFailure = 0;
const shouldCheckParachute = () => totalTurnsPlayed() !== lastParachuteFailure;
const updateParachuteFailure = () =>
  (lastParachuteFailure = totalTurnsPlayed());

function createWandererOutfit(
  details: Delayed<WanderDetails>,
  spec: Delayed<OutfitSpec>,
  additionalOutfitOptions: Omit<FreeFightOutfitMenuOptions, "wanderOptions">,
): Outfit {
  const wanderTarget = wanderer().getTarget(undelay(details));
  const needPeridot = wanderTarget.peridotMonster !== $monster.none;
  const sourceOutfit = Outfit.from(
    undelay(spec),
    new Error(
      `Failed to build outfit for Wanderer from ${JSON.stringify(undelay(spec))}`,
    ),
  );
  if (wanderTarget.familiar !== $familiar`none`) {
    sourceOutfit.familiar = wanderTarget.familiar;
  }
  if (needPeridot) sourceOutfit.equip($item`Peridot of Peril`);

  return freeFightOutfit(
    sourceOutfit.spec(),
    undelay(details),
    additionalOutfitOptions,
  );
}

function wanderTask(
  details: Delayed<WanderDetails>,
  spec: Delayed<OutfitSpec>,
  base: Omit<GarboTask, "outfit" | "do" | "choices" | "spendsTurn"> & {
    combat?: GarboStrategy;
  },
  additionalOutfitOptions: Omit<
    FreeFightOutfitMenuOptions,
    "wanderOptions"
  > = {},
): GarboTask {
  return {
    do: () => wanderer().getTarget(undelay(details)).location,
    choices: () => wanderer().getChoices(undelay(details)),
    outfit: () => createWandererOutfit(details, spec, additionalOutfitOptions),
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

  // TODO: if you didn't digitize a target, this equation may not be right
  if (
    mallPrice($item`pulled green taffy`) >
    (targetingMeat()
      ? MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")
      : get("valueOfAdventure"))
  ) {
    return false;
  }

  if (have($effect`Fishy`)) return true;
  if (willYachtzee()) return false;
  if (have($item`fishy pipe`) && !get("_fishyPipeUsed")) {
    use($item`fishy pipe`);
    if (have($effect`Fishy`)) return true;
  }

  if (get("skateParkStatus") === "ice" && !get("_skateBuff1")) {
    cliExecute("skate lutz");
    if (have($effect`Fishy`)) return true;
  }

  return false;
}

/**
 * Creates autoattack and postAuto macros for digitize wanderer fights.
 * @param targetKillMacro - Macro to use when digitize monster is the target
 * @param nonTargetKillMacro - Macro to use otherwise (defaults to Macro.kill())
 */
function digitizeMacros(
  targetKillMacro: Macro,
  nonTargetKillMacro: Macro = Macro.kill(),
): [() => Macro, () => Macro] {
  const makeMacro =
    (useAutoattackCondition: boolean): (() => Macro) =>
    () => {
      const digitizeMonster =
        SourceTerminal.getDigitizeMonster() ?? $monster.none;
      const condition = useAutoattackCondition
        ? digitizeMonster
        : `(monsterid ${digitizeMonster.id}) && !gotjump && !(pastround 2)`;
      return Macro.if_(
        condition,
        Macro.externalIf(
          digitizeMonster === globalOptions.target,
          targetKillMacro,
          nonTargetKillMacro,
        ),
      ).abortWithMsg(
        `Expected a digitized ${digitizeMonster}, but encountered something else.`,
      );
    };
  return [makeMacro(true), makeMacro(false)];
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
      DesignerSweatpants.canUseSkill($skill`Sweat Out Some Booze`) &&
      myInebriety() > 0 &&
      myAdventures() <= 1 + globalOptions.saveTurns,
    completed: () =>
      $skill`Sweat Out Some Booze`.dailylimit === 0 ||
      myInebriety() -
        DesignerSweatpants.potentialCasts($skill`Sweat Out Some Booze`) >
        inebrietyLimit(),
    do: () => {
      while (
        DesignerSweatpants.canUseSkill($skill`Sweat Out Some Booze`) &&
        myInebriety() > 0
      ) {
        DesignerSweatpants.useSkill($skill`Sweat Out Some Booze`);
      }
      consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
    },
    spendsTurn: false,
  },
  {
    name: "Law of Averages",
    ready: () => myAdventures() <= Math.min(1 + globalOptions.saveTurns, 199),
    completed: () => $item`Law of Averages`.dailyusesleft === 0,
    do: () => use($item`Law of Averages`),
    spendsTurn: false,
  },
];

function dailyDungeon(additionalReady: () => boolean) {
  return {
    completed: () => get("dailyDungeonDone"),
    ready: () =>
      additionalReady() &&
      garboValue($item`fat loot token`) >
        get("valueOfAdventure") *
          clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    choices: () => ({
      689: 1,
      690: 2,
      691:
        haveEquipped($item`candy cane sword cane`) &&
        !get("candyCaneSwordDailyDungeon")
          ? 4
          : 2,
      692: 3,
      693: 2,
    }),
    acquire:
      $items`ring of Detect Boring Doors, eleven-foot pole, Pick-O-Matic lockpicks`.map(
        (i) => ({ item: i }),
      ),
    do: $location`The Daily Dungeon`,
    combat: new GarboStrategy(() => Macro.kill()),
    turns: () => clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    outfit: { equip: $items`candy cane sword cane` },
    spendsTurn: true,
  };
}

function lavaDogs(additionalReady: () => boolean, baseSpec: OutfitSpec) {
  return {
    completed: () => lavaDogsComplete(),
    ready: () =>
      additionalReady() &&
      globalOptions.ascend &&
      lavaDogsAccessible() &&
      garboValue($item`Volcoino`) >
        6 * get("valueOfAdventure") +
          (hotTubAvailable()
            ? 0
            : mallPrice($item`soft green echo eyedrop antidote`)) &&
      $items`June cleaver, Space Trip safety headphones`.some(
        (i) => have(i) && canEquip(i),
      ),
    prepare: () => {
      const metalValue = get("_volcanoSuperduperheatedMetal")
        ? garboValue($item`superheated metal`)
        : sum(
            [
              [$item`superheated metal`, 0.95],
              [$item`superduperheated metal`, 0.05],
            ] as const,
            ([item, rate]) => rate * garboValue(item),
          );
      if (metalValue > mallPrice($item`heat-resistant sheet metal`)) {
        acquire(1, $item`heat-resistant sheet metal`, metalValue);
      }
    },
    do: $location`The Bubblin' Caldera`,
    outfit: () => {
      const avoid = $items`carnivorous potted plant, mutant crown, mutant arm, mutant legs, shield of the Skeleton Lord`;
      if (!have($effect`Drenched in Lava`)) return baseSpec;
      const weapon = have($item`June cleaver`) ? $item`June cleaver` : [];
      const modifier = ["Muscle"];
      if (!have($item`June cleaver`)) modifier.push(`-7 Monster Level`);

      return freeFightOutfit(
        { ...baseSpec, modifier, weapon, avoid },
        $location`The Bubblin' Caldera`,
      );
    },
    combat: new GarboStrategy(() => Macro.kill()),
    turns: () => clamp(7 - $location`The Bubblin' Caldera`.turnsSpent, 0, 7),
    spendsTurn: true,
  };
}

function luckyTasks(
  sobriety: "sober" | "drunk",
  additionalReady: () => boolean,
): AlternateTask[] {
  return [
    {
      name: `Lucky Adventure (${sobriety})`,
      completed: () => !have($effect`Lucky!`),
      ready: () =>
        additionalReady() &&
        getBestLuckyAdventure().phase === "barf" &&
        getBestLuckyAdventure().value() > get("valueOfAdventure"),
      do: () => getBestLuckyAdventure().location,
      outfit: () =>
        sobriety === "drunk" ? { offhand: $item`Drunkula's wineglass` } : {},
      combat: new GarboStrategy(() =>
        Macro.abortWithMsg(
          "Unexpected combat while attempting Lucky! adventure",
        ),
      ),
      sobriety,
      spendsTurn: true,
      turns: 0, // Turns spent is handled by Lucky Sources
    },
    {
      name: `Apriling Band Lucky (${sobriety})`,
      completed: () =>
        have($effect`Lucky!`) ||
        !AprilingBandHelmet.canPlay("Apriling band saxophone"),
      ready: () =>
        additionalReady() &&
        have($item`Apriling band saxophone`) &&
        getBestLuckyAdventure().phase === "barf" &&
        getBestLuckyAdventure().value() > get("valueOfAdventure"),
      do: () => {
        if (!have($effect`Lucky!`)) {
          AprilingBandHelmet.play($item`Apriling band saxophone`);
        }
      },
      sobriety,
      spendsTurn: false,
      turns: () => $item`Apriling band saxophone`.dailyusesleft,
    },
    {
      name: `August Scepter Lucky (${sobriety})`,
      completed: () =>
        have($effect`Lucky!`) ||
        !shouldAugustCast($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`),
      ready: () =>
        additionalReady() &&
        getBestLuckyAdventure().phase === "barf" &&
        getBestLuckyAdventure().value() > get("valueOfAdventure"),
      do: () => {
        if (!have($effect`Lucky!`)) {
          useSkill($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`);
          if (!have($effect`Lucky!`)) {
            set("_aug2Cast", true);
          }
        }
      },
      sobriety,
      spendsTurn: false,
      turns: () =>
        shouldAugustCast($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`)
          ? 1
          : 0,
    },
    {
      name: `Pillkeeper Lucky (${sobriety})`,
      completed: () => have($effect`Lucky!`) || get("_freePillKeeperUsed"),
      ready: () =>
        additionalReady() &&
        have($item`Eight Days a Week Pill Keeper`) &&
        getBestLuckyAdventure().phase === "barf" &&
        getBestLuckyAdventure().value() > get("valueOfAdventure"),
      do: () => {
        if (!have($effect`Lucky!`)) {
          retrieveItem($item`Eight Days a Week Pill Keeper`);
          cliExecute("pillkeeper semirare");
          if (!have($effect`Lucky!`)) {
            set("_freePillKeeperUsed", true);
          }
        }
      },
      sobriety,
      spendsTurn: false,
      turns: () => (!get("_freePillKeeperUsed") ? 1 : 0),
    },
  ];
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
      freeFightOutfit(
        {
          equip: $items`plastic vampire fangs`,
        },
        Location.none,
      ),
    spendsTurn: true,
    turns: () => 1,
  };
}

let bestDupeItem: Item | null = null;
function getBestDupeItem(): Item {
  if (bestDupeItem === null || !have(bestDupeItem)) {
    // Machine elf can dupe PVPable food, booze, spleen item or potion
    const validItems = Item.all().filter(
      (i) =>
        i.tradeable &&
        i.discardable &&
        (i.inebriety || i.fullness || i.potion || i.spleen) &&
        have(i),
    );
    if (
      globalOptions.prefs.dmtDupeItem &&
      validItems.includes(globalOptions.prefs.dmtDupeItem)
    ) {
      bestDupeItem = globalOptions.prefs.dmtDupeItem;
    } else {
      bestDupeItem = maxBy(validItems, garboValue);
    }
  }
  return bestDupeItem;
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

const peridotZone = () =>
  getAvailableUltraRareZones().find(
    (l) => PeridotOfPeril.canImperil(l) && !unperidotableZones.includes(l),
  );

const NonBarfTurnTasks: AlternateTask[] = [
  {
    name: "Make Mimic Eggs (whatever we can)",
    ready: () => have($familiar`Chest Mimic`),
    completed: () =>
      get("_mimicEggsObtained") >= 11 ||
      $familiar`Chest Mimic`.experience < minimumMimicExperience(),
    do: () => {
      if (!ChestMimic.differentiableQuantity(globalOptions.target)) {
        ChestMimic.receive(globalOptions.target);
      }
      ChestMimic.differentiate(globalOptions.target);
    },
    outfit: () => meatTargetOutfit({ familiar: $familiar`Chest Mimic` }),
    combat: new GarboStrategy(() => Macro.meatKill()),
    turns: () =>
      globalOptions.ascend
        ? clamp(
            Math.floor($familiar`Chest Mimic`.experience / 50) - 1,
            1,
            11 - get("_mimicEggsObtained"),
          )
        : 0,
    spendsTurn: true,
  },
  {
    name: "Machine Elf Dupe",
    ready: () =>
      have($familiar`Machine Elf`) &&
      // Dupe at end of day even if not ascending, encountersUntilDMTChoice does not reset on rollover
      willDrunkAdventure() === !sober() &&
      get("encountersUntilDMTChoice") === 0 &&
      garboValue(getBestDupeItem()) > get("valueOfAdventure"),
    completed: () => get("lastDMTDuplication") === myAscensions(),
    do: $location`The Deep Machine Tunnels`,
    prepare: () => {
      if (itemAmount(getBestDupeItem()) === 0) {
        withProperty("autoSatisfyWithMall", false, () =>
          retrieveItem(getBestDupeItem()),
        );
      }
    },
    outfit: () =>
      sober()
        ? {
            avoid: $items`Kramco Sausage-o-Matic™`,
            familiar: $familiar`Machine Elf`,
          }
        : {
            offhand: $item`Drunkula's wineglass`,
            familiar: $familiar`Machine Elf`,
          },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () => 1,
    spendsTurn: true,
    choices: () => ({ 1119: 4, 1125: `1&iid=${getBestDupeItem().id}` }),
  },
  {
    name: "Lava Dogs (drunk)",
    ...lavaDogs(() => willDrunkAdventure(), {
      offhand: $item`Drunkula's wineglass`,
    }),
    sobriety: "drunk",
  },
  {
    name: "Lava Dogs (sober)",
    ...lavaDogs(() => !willDrunkAdventure(), {}),
    sobriety: "sober",
  },
  ...getTasks(yachtzeeQuest), // Use NC forces and adventure to get the Yachtzee NC
  {
    name: "Daily Dungeon (drunk)",
    ...dailyDungeon(() => willDrunkAdventure()),
    outfit: () =>
      freeFightOutfit(
        {
          offhand: $item`Drunkula's wineglass`,
          equip: $items`ring of Detect Boring Doors`,
        },
        $location`The Daily Dungeon`,
      ),
    sobriety: "drunk",
  },
  {
    name: "Daily Dungeon (sober)",
    ...dailyDungeon(() => !willDrunkAdventure()),
    outfit: () =>
      freeFightOutfit(
        {
          equip: $items`ring of Detect Boring Doors`,
        },
        $location`The Daily Dungeon`,
      ),
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
    outfit: () =>
      sober()
        ? { avoid: $items`Kramco Sausage-o-Matic™` }
        : { offhand: $item`Drunkula's wineglass` },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () => 1,
    spendsTurn: true,
    choices: { 1091: 7 },
  },
  ...luckyTasks("sober", () => !willDrunkAdventure()),
  ...luckyTasks("drunk", () => willDrunkAdventure()),
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
    do: () =>
      withProperty("choiceAdventureScript", "", () => {
        ensureEffect($effect`Transpondent`);
        use($item`Map to Safety Shelter Grimace Prime`);
        return true;
      }),
    spendsTurn: true,
    sobriety: "drunk",
    turns: () => availableAmount($item`Map to Safety Shelter Grimace Prime`),
  },
  {
    name: "Peridot Fish for UR",
    ready: () =>
      have($item`Peridot of Peril`) && !(willDrunkAdventure() && sober()),
    completed: () => !peridotZone(),
    do: peridotZone,
    outfit: () =>
      freeFightOutfit(
        sober()
          ? { acc1: $item`Peridot of Peril` }
          : {
              acc1: $item`Peridot of Peril`,
              offhand: $item`Drunkula's wineglass`,
            },
        peridotZone() ?? Location.none,
      ),
    turns: () => (peridotZone() ? 1 : 0),
    spendsTurn: false,
    combat: new GarboStrategy(() => Macro.kill()),
    choices: () => ({
      ...wanderer().getChoices(peridotZone() ?? $location.none),
      1557: 2,
    }),
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
      meatTargetOutfit(sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    spendsTurn: isSteve,
    combat: new GarboStrategy(() =>
      Macro.if_(
        $monster`Stephen Spookyraven`,
        Macro.basicCombat(),
      ).abortWithMsg("Expected to fight Stephen Spookyraven, but didn't!"),
    ),
  },
  {
    name: "Use Walkie Talkie for Ghost",
    ready: () =>
      mallPrice($item`almost-dead walkie-talkie`) <
        globalOptions.prefs.valueOfFreeFight &&
      get("nextParanormalActivity") <= totalTurnsPlayed(),
    completed: () =>
      have($item`protonic accelerator pack`) ||
      get("questPAGhost") === "started",
    do: () => {
      if (
        acquire(
          1,
          $item`almost-dead walkie-talkie`,
          globalOptions.prefs.valueOfFreeFight,
          false,
        )
      ) {
        use($item`almost-dead walkie-talkie`);
      }
    },
    spendsTurn: false,
    limit: { skip: 40 }, // Safeguard to avoid infinite loops if mallPrice can bug
  },
  {
    name: "Proton Ghost",
    ready: () => !!get("ghostLocation"),
    completed: () => get("questPAGhost") === "unstarted",
    do: () => get("ghostLocation") as Location,
    outfit: () =>
      freeFightOutfit(
        {
          modifier:
            get("ghostLocation") === $location`The Icy Peak`
              ? ["Cold Resistance 5 min"]
              : [],
          back: have($item`protonic accelerator pack`)
            ? $item`protonic accelerator pack`
            : [],
        },
        get("ghostLocation") as Location,
      ),
    choices: () =>
      wanderer().getChoices(get("ghostLocation") ?? $location.none),
    combat: new GarboStrategy(() =>
      have($item`protonic accelerator pack`)
        ? Macro.ghostBustin()
        : Macro.basicCombat(),
    ),
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
    outfit: () => meatTargetOutfit({}, $location`The Briny Deeps`),
    combat: new GarboStrategy(
      ...digitizeMacros(Macro.item($item`pulled green taffy`).meatKill()),
    ),
    sobriety: "sober",
    spendsTurn: true,
  },
  {
    name: "Digitize Wanderer",
    completed: () => Counter.get("Digitize Monster") > 0,
    outfit: () =>
      digitizedTarget()
        ? meatTargetOutfit(
            get("_mimicEggsObtained") < 11 &&
              $familiar`Chest Mimic`.experience >
                (digitizedMonstersRemaining() === 1
                  ? 50
                  : (11 - get("_mimicEggsObtained")) * 50)
              ? { familiar: $familiar`Chest Mimic` }
              : {},
            wanderer().getTarget({
              wanderer: "wanderer",
              allowEquipment: false,
            }).location,
          )
        : freeFightOutfit(
            undefined,
            wanderer().getTarget({
              wanderer: "wanderer",
              allowEquipment: false,
            }).location,
          ),
    do: () =>
      wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false })
        .location,
    choices: () =>
      wanderer().getChoices({
        wanderer: "wanderer",
        allowEquipment: false,
      }),
    combat: new GarboStrategy(...digitizeMacros(Macro.meatKill())),
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
    outfit: meatTargetOutfit,
    combat: new GarboStrategy(() => Macro.target("envyfish egg")),
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
          .duplicate()
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
          .duplicate()
          .skill($skill`Spit jurassic acid`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "freefight",
    () => ({
      weapon: $item`Sheriff pistol`,
      acc1: $item`Sheriff badge`,
      acc2: $item`Sheriff moustache`,
    }),
    {
      name: "Assert your Authority",
      ready: () =>
        have($item`Sheriff pistol`) &&
        have($item`Sheriff badge`) &&
        have($item`Sheriff moustache`) &&
        romanticMonsterImpossible(),
      completed: () => get("_assertYourAuthorityCast") >= 3,
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .familiarActions()
          .skill($skill`Assert your Authority`),
      ),
      sobriety: "sober",
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
          .skill($skill`Free-For-All`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "freefight",
    {
      offhand:
        guaranteedBullseye() || have($item`spring shoes`)
          ? []
          : $item`Roman Candelabra`,
      acc1: $item`Everfull Dart Holster`,
      acc2:
        guaranteedBullseye() || !have($item`spring shoes`)
          ? []
          : $item`spring shoes`,
      modifier: guaranteedBullseye() ? [] : "Monster Level",
    },
    {
      name: "Darts: Bullseye",
      ready: safeToAttemptBullseye,
      completed: () => !canBullseye(),
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .familiarActions()
          .skill($skill`Darts: Aim for the Bullseye`)
          .trySkill($skill`Spring Away`)
          .trySkill($skill`Blow the Green Candle!`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "freefight",
    {},
    {
      name: "Heavy Rains Lightning Strike",
      ready: () => have($skill`Lightning Strike`) && myLightning() >= 20,
      completed: () => myLightning() < 20,
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .familiarActions()
          .skill($skill`Lightning Strike`),
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
          .duplicate()
          .skill($skill`Shocking Lick`),
      ),
      duplicate: true,
      sobriety: "sober",
    },
  ),
  wanderTask(
    "freerun",
    () => ({
      equip: $items`spring shoes, carnivorous potted plant`.filter((i) =>
        have(i),
      ),
    }),
    {
      name: "Spring Shoes Freerun",
      ready: () =>
        have($item`spring shoes`) &&
        romanticMonsterImpossible() &&
        (getWorkshed() !== $item`model train set` ||
          TrainSet.next() !== TrainSet.Station.GAIN_MEAT) &&
        (guaranteedBullseye() ||
          !safeToAttemptBullseye() ||
          have($skill`Free-For-All`) ||
          have($effect`Everything Looks Red`, 30)),
      completed: () => have($effect`Everything Looks Green`),
      combat: new GarboStrategy(
        () =>
          Macro.if_(globalOptions.target, Macro.meatKill())
            .familiarActions()
            .skill($skill`Spring Away`),
        undefined,
        () => !have($item`carnivorous potted plant`), // Do not use autoattack with carn plant, it will cancel the swallow
      ),
      sobriety: "sober",
    },
    {
      familiarOptions: {
        mode: "run",
      },
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
    spendsTurn: false,
  },
  {
    name: "Gingerbread Midnight",
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
    spendsTurn: false,
  },
  {
    name: "Rain Man",
    ready: () => myRain() >= 50 && have($skill`Rain Man`),
    completed: () => myRain() < 50,
    do: () => {
      HeavyRains.rainMan(globalOptions.target);
    },
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: () => globalOptions.target.attributes.includes("FREE"),
    outfit: () => meatTargetOutfit(),
  },
  {
    name: "Make Mimic Eggs (maximum eggs)",
    ready: () => shouldMakeEgg(true),
    completed: () => get("_mimicEggsObtained") >= 11,
    do: () => {
      if (ChestMimic.differentiableQuantity(globalOptions.target) < 1) {
        ChestMimic.receive(globalOptions.target);
      }
      ChestMimic.differentiate(globalOptions.target);
    },
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: () => globalOptions.target.attributes.includes("FREE"),
    outfit: () => meatTargetOutfit({ familiar: $familiar`Chest Mimic` }),
  },
  {
    name: "Fight Mimic Eggs",
    ready: () => globalOptions.ascend,
    completed: () =>
      ChestMimic.differentiableQuantity(globalOptions.target) === 0,
    do: () => ChestMimic.differentiate(globalOptions.target),
    outfit: () => meatTargetOutfit(),
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: () => globalOptions.target.attributes.includes("FREE"),
  },
  {
    name: "Liana Parachute",
    ready: () =>
      (sober() ||
        (have($item`Drunkula's wineglass`) &&
          canEquip($item`Drunkula's wineglass`))) &&
      CrepeParachute.have() &&
      shouldCheckParachute() &&
      questStep("questL11Worship") > 3 &&
      have($item`antique machete`), // TODO Support other machete's
    completed: () => have($effect`Everything looks Beige`),
    outfit: () =>
      freeFightOutfit({ weapon: $item`antique machete` }, Location.none),
    do: () => CrepeParachute.fight($monster`dense liana`),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "Did not instantly kill the Liana, check what went wrong",
      ),
    ),
    prepare: () => {
      if (!sober()) {
        freeFightOutfit(
          { offhand: $item`Drunkula's wineglass` },
          Location.none,
        ).dress();
      }
      withChoice(785, 6, () =>
        adv1($location`An Overgrown Shrine (Northeast)`, -1, ""),
      );
      if (!sober()) {
        freeFightOutfit(
          { weapon: $item`antique machete` },
          Location.none,
        ).dress();
      }
    },
    post: () => {
      if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
    },
    spendsTurn: false,
  },
  {
    name: "Fight Cookbookbat Quest Target",
    ready: () => {
      const questMonster = get("_cookbookbatQuestMonster");
      if (!questMonster || hasNameCollision(questMonster)) return false;
      const questLocation = get("_cookbookbatQuestLastLocation");
      if (!questLocation || !canAdventureOrUnlock(questLocation, false)) {
        return false;
      }
      const questReward = get("_cookbookbatQuestIngredient");
      return (
        PeridotOfPeril.have() &&
        !!questReward &&
        3 * garboValue(questReward) > get("valueOfAdventure")
      );
    },
    completed: () => {
      const questLocation = get("_cookbookbatQuestLastLocation");
      return (
        !questLocation ||
        !PeridotOfPeril.canImperil(questLocation) ||
        unperidotableZones.includes(questLocation)
      );
    },
    choices: () => ({
      1557: `1&bandersnatch=${get("_cookbookbatQuestMonster")?.id ?? 0}`,
      ...wanderer().getChoices(
        get("_cookbookbatQuestLastLocation") ?? $location.none,
      ),
    }),
    outfit: () =>
      freeFightOutfit(
        {
          equip: sober()
            ? $items`Peridot of Peril`
            : $items`Peridot of Peril, Drunkula's wineglass`,
          familiar: $familiar`Cookbookbat`,
        },
        get("_cookbookbatQuestLastLocation") ?? Location.none,
      ),
    do: () => get("_cookbookbatQuestLastLocation"),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: true,
  },
];

function nonBarfTurns(): number {
  return sum(
    NonBarfTurnTasks.filter((t) => (t.ready?.() ?? true) && !t.completed()),
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

let startedNonBarf: boolean = false;
export const NonBarfTurnQuest: Quest<GarboTask> = {
  name: "Non Barf Turn",
  tasks: NonBarfTurnTasks,
  ready: () => {
    if (!startedNonBarf) {
      startedNonBarf =
        clamp(
          myAdventures() - digitizedMonstersRemaining(),
          1,
          myAdventures(),
        ) <=
        nonBarfTurns() + globalOptions.saveTurns;
    }
    return startedNonBarf;
  },

  completed: () => !canContinue(),
};

export const BarfTurnQuest: Quest<GarboTask> = {
  name: "Barf Turn",
  tasks: [
    {
      name: "Barf Parachute",
      ready: () =>
        CrepeParachute.have() &&
        shouldCheckParachute() &&
        myLocation() === $location`Barf Mountain`,
      completed: () => have($effect`Everything looks Beige`),
      outfit: () => barfOutfit({}),
      do: () => CrepeParachute.fight(getPreferredBarfMonster()),
      combat: new GarboStrategy(() => Macro.meatKill()),
      prepare: () =>
        !(totalTurnsPlayed() % 11) && meatMood().execute(estimatedGarboTurns()),
      post: () => {
        if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
        completeBarfQuest();
        trackMarginalMpa();
      },
      spendsTurn: true,
    },
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
      prepare: () =>
        !get("dinseyRollercoasterNext") &&
        !(totalTurnsPlayed() % 11) &&
        meatMood().execute(estimatedGarboTurns()),
      post: () => {
        completeBarfQuest();
        trackMarginalMpa();
      },
      spendsTurn: true,
    },
  ],
  completed: () => !canContinue(),
};

export const DailyExtrasQuest: Quest<GarboTask> = {
  name: "Daily Extras",
  tasks: [mayamCalendarSummon()],
};

export const BarfTurnQuests = [
  TurnGenQuest,
  DailyExtrasQuest,
  WandererQuest,
  NonBarfTurnQuest,
  BarfTurnQuest,
];
