import { Outfit } from "grimoire-kolmafia";
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
  get,
  have,
} from "libram";
import { barfOutfit } from "./outfit";
import { Macro } from "./combat";
import { FarmingMethod, globalOptions } from "./config";
import {
  chooseBanish,
  getMonstersToBanish,
  redTaffyWorth,
} from "./resources/banish";

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

interface FarmingStrategy {
  stasisRounds(): number;
  asdonEffect(): Effect;
  ensureBarfAccess(): boolean;
  baseMeat(): number;
  accountForNC(): boolean;
  turnsToNC(): number;
  bonusModifiers(): Modifier[];
  location(): Location;
  ensureML(): boolean;
  bonusEffects(): Effect[];
  monstersToBanish(): Monster[];
  targetMonster: () => Monster;

  outfit(): Outfit;
  combat(): GarboStrategy;
}

const BARF_MOUNTAIN: FarmingStrategy = {
  stasisRounds: () => 20,
  asdonEffect: () => $effect`Driving Observantly`,
  ensureBarfAccess: () => true,
  baseMeat: () => 250,
  accountForNC: () => true,
  turnsToNC: () =>
    (27 * barfTourists) /
      (garbageTourists + angryTourists + 3 * touristFamilies) +
    1 * touristFamilyRatio +
    2 * (1 - touristFamilyRatio) * touristFamilyRatio +
    3 * (1 - touristFamilyRatio) * (1 - touristFamilyRatio),
  bonusModifiers: () => $modifiers``,
  location: () => $location`Barf Mountain`,
  ensureML: () => true,
  bonusEffects: () => $effects`How to Scam Tourists`,
  monstersToBanish: () => $monsters``,
  targetMonster: () =>
    have($familiar`Skeleton of Crimbo Past`) &&
    get("_knuckleboneDrops", 0) < 100
      ? $monster`angry tourist`
      : $monster`garbage tourist`,

  outfit: () => {
    const lubing = get("dinseyRollercoasterNext") && have($item`lube-shoes`);

    return barfOutfit(lubing ? { equip: $items`lube-shoes` } : {});
  },

  combat: () =>
    new GarboStrategy(
      () => Macro.meatKill(),
      () =>
        Macro.if_(
          `(monsterid ${globalOptions.target.id}) && !gotjump && !(pastround 2)`,
          Macro.meatKill(),
        ).abort(),
    ),
};

const THE_CORAL_CORRAL: FarmingStrategy = {
  stasisRounds: () => 5,
  asdonEffect: () => $effect`Driving Waterproofly`,
  ensureBarfAccess: () => false,
  baseMeat: () => 300,
  accountForNC: () => false,
  turnsToNC: () => Infinity,
  bonusModifiers: () => $modifiers`Hidden Familiar Weight, Meat Drop Penalty`,
  location: () => $location`The Coral Corral`,
  ensureML: () => false,
  bonusEffects: () => $effects``,
  monstersToBanish: () => $monsters`Mer-kin rustler, sea cowboy`,
  targetMonster: () => $monster`sea cow`,

  outfit: () => {
    const banishItem = chooseBanish()?.equip;
    if (banishItem) {
      print(`Planning to banish using ${banishItem?.name}`);
    }

    return barfOutfit({
      ...(have($effect`Driving Waterproofly`)
        ? {}
        : { pants: $item`really, really nice swimming trunks` }),
      ...(banishItem ? { equip: [banishItem] } : {}),
    });
  },

  combat: () =>
    new GarboStrategy(() => {
      const banishMethod = chooseBanish();
      if (banishMethod) {
        print(`Planning to banish using ${banishMethod?.name}`);
      }
      if (banishMethod === null && getMonstersToBanish().length > 0) {
        throw new Error(
          "I have monsters to banish for cowo, but no banishes are available!",
        );
      }
      if (redTaffyWorth()) {
        return Macro.if_(
          $monsters`Mer-kin rustler, sea cowboy`,
          banishMethod?.macro ?? Macro.abort(),
        )
          .tryItem($item`pulled red taffy`)
          .meatKill();
      } else {
        return Macro.if_(
          $monsters`Mer-kin rustler, sea cowboy`,
          banishMethod?.macro ?? Macro.abort(),
        ).meatKill();
      }
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
