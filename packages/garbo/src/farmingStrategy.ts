import { OutfitSpec } from "grimoire-kolmafia";
import {
  Effect,
  isBanished,
  Location,
  mallPrice,
  Modifier,
  Monster,
  print,
} from "kolmafia";
import { GarboStrategy } from "./combatStrategy";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $modifiers,
  $monster,
  $monsters,
  $skill,
  Delayed,
  get,
  have,
  PulledTaffy,
  sum,
} from "libram";
import { Macro } from "./combat";
import { FarmingMethod, globalOptions } from "./config";
import { completeBarfQuest } from "./resources/realm";
import { GarboContext } from "./tasks/context";
import { garboValue } from "./garboValue";

export function getMonstersToBanish(monstersToBanish: Monster[]): Monster[] {
  return monstersToBanish.filter((monster) => !isBanished(monster));
}

export function redTaffyWorth(): boolean {
  const averageRedTaffyValue = sum(
    [...PulledTaffy.RED_TAFFY_DROP_WEIGHTS.entries()],
    ([item, weight]) => garboValue(item) * weight,
  );

  return mallPrice($item`pulled red taffy`) < averageRedTaffyValue;
}

const olfactionCopies = have($skill`Transcendent Olfaction`) ? 3 : 0;
const gallapagosCopies = have($skill`Gallapagosian Mating Call`) ? 1 : 0;
const garbageTourists = 1 + olfactionCopies + gallapagosCopies,
  touristFamilies = 1,
  angryTourists = 1;
const barfTourists = garbageTourists + touristFamilies + angryTourists;
export const garbageTouristRatio = garbageTourists / barfTourists;
const touristFamilyRatio = touristFamilies / barfTourists;
// 30 tourists till NC, with families counting as 3
// Estimate number of turns till the counter hits 27
// then estimate the expected number of turns required to hit a counter of >= 30

type FarmingStrategy = {
  stasisRounds: number;
  asdonEffect: Effect;
  ensureBarfAccess: boolean;
  baseMeat: number;
  accountForNC: boolean;
  turnsToNC(): number;
  bonusModifiers: Modifier[];
  location: Location;
  ensureML: boolean;
  bonusEffects: Effect[];
  monstersToBanish: Monster[];
  targetMonster: Delayed<Monster>;
  shouldOlfact: boolean;

  outfit: (context: GarboContext) => OutfitSpec;
  combat: GarboStrategy;
  post?: () => void;
};

const BARF_MOUNTAIN: FarmingStrategy = {
  stasisRounds: 20,
  asdonEffect: $effect`Driving Observantly`,
  ensureBarfAccess: true,
  baseMeat: 250,
  accountForNC: true,
  turnsToNC: () =>
    (27 * barfTourists) /
      (garbageTourists + angryTourists + 3 * touristFamilies) +
    1 * touristFamilyRatio +
    2 * (1 - touristFamilyRatio) * touristFamilyRatio +
    3 * (1 - touristFamilyRatio) * (1 - touristFamilyRatio),
  bonusModifiers: [],
  location: $location`Barf Mountain`,
  ensureML: true,
  bonusEffects: $effects`How to Scam Tourists`,
  monstersToBanish: [],
  targetMonster: () =>
    have($familiar`Skeleton of Crimbo Past`) &&
    get("_knuckleboneDrops", 0) < 100
      ? $monster`angry tourist`
      : $monster`garbage tourist`,
  shouldOlfact: true,

  outfit: () => ({
    equip:
      get("dinseyRollercoasterNext") && have($item`lube-shoes`)
        ? $items`lube-shoes`
        : [],
  }),

  combat: new GarboStrategy(
    () => Macro.meatKill(),
    () =>
      Macro.if_(
        `(monsterid ${globalOptions.target.id}) && !gotjump && !(pastround 2)`,
        Macro.meatKill(),
      ).abort(),
  ),

  post: completeBarfQuest,
};

const THE_CORAL_CORRAL: FarmingStrategy = {
  stasisRounds: 5,
  asdonEffect: $effect`Driving Waterproofly`,
  ensureBarfAccess: false,
  baseMeat: 300,
  accountForNC: false,
  turnsToNC: () => Infinity,
  bonusModifiers: $modifiers`Hidden Familiar Weight, Meat Drop Penalty`,
  location: $location`The Coral Corral`,
  ensureML: false,
  bonusEffects: [],
  monstersToBanish: $monsters`Mer-kin rustler, sea cowboy`,
  targetMonster: $monster`sea cow`,
  shouldOlfact: false,

  outfit: ({ banish }) => {
    const banishItem = banish?.equip;
    if (banishItem) {
      print(`Planning to banish equipping ${banishItem?.name}`);
    }

    return banishItem ? { equip: [banishItem] } : {};
  },

  combat: new GarboStrategy(({ banish }) => {
    const baseMacro = Macro.externalIf(
      !get("seahorseName"),
      Macro.if_(
        $monster`wild seahorse`,
        Macro.item($item`sea cowbell`)
          .item($item`sea cowbell`)
          .item($item`sea cowbell`)
          .item($item`sea lasso`)
          .abortWithMsg("Wild seahorse should have been tamed, what happened?"),
      ),
    )
      // Cows are tough! Let's delevel them to be safe
      .delevel()
      .tryHaveItem($item`cow poker`);

    if (banish) {
      const banishMacro = baseMacro.if_(
        $monsters`Mer-kin rustler, sea cowboy`,
        banish.macro,
      );

      return redTaffyWorth()
        ? banishMacro.tryItem($item`pulled red taffy`).meatKill()
        : banishMacro.meatKill();
    }

    return redTaffyWorth()
      ? baseMacro.tryItem($item`pulled red taffy`).meatKill()
      : baseMacro.meatKill();
  }),
};

export function farmingStrategy(): FarmingStrategy {
  switch (globalOptions.prefs.farmingMethod) {
    case FarmingMethod.THE_CORAL_CORRAL:
      return THE_CORAL_CORRAL;

    case FarmingMethod.BARF_MOUNTAIN:
    default:
      return BARF_MOUNTAIN;
  }
}
