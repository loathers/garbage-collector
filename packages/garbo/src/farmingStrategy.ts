import { OutfitSpec } from "grimoire-kolmafia";
import {
  Effect,
  getMonsters,
  isBanished,
  itemDropsArray,
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
  adventureTargetToWeightedMap,
  Delayed,
  get,
  have,
  PulledTaffy,
  sum,
  undelay,
} from "libram";
import { Macro } from "./combat";
import { FarmingMethod, globalOptions } from "./config";
import { completeBarfQuest } from "./resources/realm";
import { FarmingContext } from "./tasks/context";
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

interface FarmingStrategyOptions {
  stasisRounds: number;
  asdonEffect: Effect;
  ensureBarfAccess: boolean;
  baseMeat: number;
  location: Location;
  ensureML: boolean;
  targetMonster: Delayed<Monster>;
  shouldOlfact: boolean;
  combat: GarboStrategy<FarmingContext>;

  outfit?: (context: FarmingContext) => OutfitSpec;
  ncTurns?: Delayed<number>;
  bonusEffects?: Effect[];
  bonusModifiers?: Modifier[];
  banishMonsters?: Monster[];
  post?: () => void;
}

const DEFAULT_OPTIONS: Readonly<{
  [K in keyof FarmingStrategyOptions as undefined extends FarmingStrategyOptions[K]
    ? K
    : never]-?: FarmingStrategyOptions[K];
}> = {
  bonusEffects: [] as Effect[],
  bonusModifiers: [] as Modifier[],
  banishMonsters: [] as Monster[],
  ncTurns: Infinity,
  post: () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  outfit: (_context: FarmingContext): OutfitSpec => ({}),
} as const;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
interface FarmingStrategySkeleton extends Required<FarmingStrategyOptions> {}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class FarmingStrategySkeleton {
  isUnderwater(): boolean {
    return this.location.environment === "underwater";
  }
  accountForNC(): boolean {
    return this.ncTurns === Infinity;
  }

  olfactMonster(): Monster | null {
    return this.shouldOlfact ? undelay(this.targetMonster) : null;
  }

  monsters(): Monster[] {
    return getMonsters(this.location);
  }

  turnsToNC(): number {
    return undelay(this.ncTurns);
  }

  ncAdjustment(): number {
    if (!this.accountForNC()) return 1;
    return this.turnsToNC() / (1 + this.turnsToNC());
  }

  itemDropValue(): number {
    return (
      sum(
        [...adventureTargetToWeightedMap(this.location).entries()],
        ([monster, monsterWeight]) =>
          monsterWeight *
          sum(
            itemDropsArray(monster),
            ({ drop, rate }) =>
              // One 100 because % the other because % improvement
              (rate / 100) * garboValue(drop),
          ),
      ) / 100
    );
  }
}

export const FarmingStrategy = new Proxy(
  new FarmingStrategySkeleton() as unknown as Readonly<FarmingStrategySkeleton>,
  {
    get: (target, prop, receiver) => {
      if (
        Object.prototype.hasOwnProperty.call(
          FarmingStrategySkeleton.prototype,
          prop,
        )
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const method = (FarmingStrategySkeleton.prototype as any)[prop];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (...args: any[]) {
          return method.apply(receiver, args);
        };
      }

      const strategyOptions = currentStrategy();

      const stringProp = String(prop);
      if (stringProp in strategyOptions) {
        return strategyOptions[stringProp as keyof FarmingStrategyOptions];
      }
      if (stringProp in DEFAULT_OPTIONS) {
        return DEFAULT_OPTIONS[stringProp as keyof typeof DEFAULT_OPTIONS];
      }
      // Fallback to standard target resolution
      return Reflect.get(target, prop, receiver);
    },
  },
);

const BARF_MOUNTAIN: FarmingStrategyOptions = {
  stasisRounds: 20,
  asdonEffect: $effect`Driving Observantly`,
  ensureBarfAccess: true,
  baseMeat: 250,
  ncTurns: () =>
    (27 * barfTourists) /
      (garbageTourists + angryTourists + 3 * touristFamilies) +
    1 * touristFamilyRatio +
    2 * (1 - touristFamilyRatio) * touristFamilyRatio +
    3 * (1 - touristFamilyRatio) * (1 - touristFamilyRatio),
  location: $location`Barf Mountain`,
  ensureML: true,
  bonusEffects: $effects`How to Scam Tourists`,
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

const THE_CORAL_CORRAL: FarmingStrategyOptions = {
  stasisRounds: 5,
  asdonEffect: $effect`Driving Waterproofly`,
  ensureBarfAccess: false,
  baseMeat: 300,
  bonusModifiers: $modifiers`Hidden Familiar Weight, Meat Drop Penalty`,
  location: $location`The Coral Corral`,
  ensureML: false,
  banishMonsters: $monsters`Mer-kin rustler, sea cowboy`,
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

function currentStrategy(): FarmingStrategyOptions {
  switch (globalOptions.prefs.farmingMethod) {
    case FarmingMethod.THE_CORAL_CORRAL:
      return THE_CORAL_CORRAL;

    case FarmingMethod.BARF_MOUNTAIN:
    default:
      return BARF_MOUNTAIN;
  }
}
