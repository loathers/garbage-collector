import { OutfitSpec } from "grimoire-kolmafia";
import { Effect, Location, Modifier, Monster, print } from "kolmafia";
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
} from "libram";
import { Macro } from "./combat";
import { FarmingMethod, globalOptions } from "./config";
import { getMonstersToBanish, redTaffyWorth } from "./resources/banish";
import { completeBarfQuest } from "./resources/realm";
import { GarboContext } from "./tasks/context";

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
    if (banish) {
      const macro = Macro.if_(
        $monsters`Mer-kin rustler, sea cowboy`,
        banish.macro,
      );

      return redTaffyWorth()
        ? macro.tryItem($item`pulled red taffy`).meatKill()
        : macro.meatKill();
    }

    if (!banish && getMonstersToBanish().length > 0) {
      throw new Error(
        "I have monsters to banish for cowo, but no banishes are available!",
      );
    }

    return redTaffyWorth()
      ? Macro.tryItem($item`pulled red taffy`).meatKill()
      : Macro.meatKill();
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
