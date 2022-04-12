import "core-js/modules/es.object.from-entries";
import {
  cliExecute,
  Effect,
  effectModifier,
  haveEffect,
  historicalAge,
  historicalPrice,
  Item,
  itemAmount,
  itemType,
  mallPrice,
  print,
  setLocation,
  use,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  clamp,
  get,
  getActiveEffects,
  getActiveSongs,
  getModifier,
  have,
  isSong,
  Mood,
  sumNumbers,
} from "libram";
import { acquire } from "./acquire";
import { baseMeat, globalOptions, HIGHLIGHT, pillkeeperOpportunityCost } from "./lib";
import { embezzlerCount, estimatedTurns } from "./embezzler";
import { usingPurse } from "./outfit";

export type PotionTier = "embezzler" | "overlap" | "barf" | "ascending";
const banned = $items`Uncle Greenspan's Bathroom Finance Guide`;

const mutuallyExclusiveList: Effect[][] = [
  $effects`Blue Tongue, Green Tongue, Orange Tongue, Purple Tongue, Red Tongue, Black Tongue`,
  $effects`Cupcake of Choice, The Cupcake of Wrath, Shiny Happy Cupcake, Your Cupcake Senses Are Tingling, Tiny Bubbles in the Cupcake`,
];
const mutuallyExclusive = new Map<Effect, Effect[]>();
for (const effectGroup of mutuallyExclusiveList) {
  for (const effect of effectGroup) {
    mutuallyExclusive.set(effect, [
      ...(mutuallyExclusive.get(effect) ?? []),
      ...effectGroup.filter((other) => other !== effect),
    ]);
  }
}

interface PotionOptions {
  providesDoubleDuration?: boolean;
  canDouble?: boolean;
  considerBarf?: boolean;
  effect?: Effect;
  duration?: number;
  use?: (quantity: number) => boolean;
}

export class Potion {
  potion: Item;
  providesDoubleDuration?: boolean;
  canDouble: boolean;
  overrideEffect?: Effect;
  overrideDuration?: number;
  useOverride?: (quantity: number) => boolean;

  constructor(potion: Item, options: PotionOptions = {}) {
    this.potion = potion;
    this.providesDoubleDuration = options.providesDoubleDuration;
    this.canDouble = options.canDouble ?? true;
    this.overrideDuration = options.duration;
    this.overrideEffect = options.effect;
    this.useOverride = options.use;
  }

  doubleDuration(): Potion {
    if (this.canDouble) {
      return new Potion(this.potion, {
        providesDoubleDuration: true,
        canDouble: this.canDouble,
        duration: this.overrideDuration,
        effect: this.overrideEffect,
        use: this.useOverride,
      });
    }
    return this;
  }

  effect(): Effect {
    return this.overrideEffect ?? effectModifier(this.potion, "Effect");
  }

  effectDuration(): number {
    return (
      (this.overrideDuration ?? getModifier("Effect Duration", this.potion)) *
      (this.providesDoubleDuration ? 2 : 1)
    );
  }

  meatDrop(): number {
    setLocation($location`none`);
    return (
      getModifier("Meat Drop", this.effect()) +
      2 * (usingPurse() ? getModifier("Smithsness", this.effect()) : 0)
    );
  }

  familiarWeight(): number {
    return getModifier("Familiar Weight", this.effect());
  }

  bonusMeat(): number {
    const familiarMultiplier = have($familiar`Robortender`)
      ? 2
      : have($familiar`Hobo Monkey`)
      ? 1.25
      : 1;

    // Assume base weight of 100 pounds. This is off but close enough.
    const assumedBaseWeight = 100;
    // Marginal value of familiar weight in % meat drop.
    const marginalValue =
      2 * familiarMultiplier +
      Math.sqrt(220 * familiarMultiplier) / (2 * Math.sqrt(assumedBaseWeight));

    return this.familiarWeight() * marginalValue + this.meatDrop();
  }

  static bonusMeat(item: Item): number {
    return new Potion(item).bonusMeat();
  }

  gross(embezzlers: number, maxTurns?: number): number {
    const bonusMeat = this.bonusMeat();
    const duration = Math.max(this.effectDuration(), maxTurns ?? 0);
    // Number of embezzlers this will actually be in effect for.
    const embezzlersApplied = Math.max(
      Math.min(duration, embezzlers) - haveEffect(this.effect()),
      0
    );

    return (bonusMeat / 100) * (baseMeat * duration + 750 * embezzlersApplied);
  }

  static gross(item: Item, embezzlers: number): number {
    return new Potion(item).gross(embezzlers);
  }

  price(historical: boolean): number {
    // If asked for historical, and age < 14 days, use historical.
    return historical && historicalAge(this.potion) < 14
      ? historicalPrice(this.potion)
      : mallPrice(this.potion);
  }

  net(embezzlers: number, historical = false): number {
    return this.gross(embezzlers) - this.price(historical);
  }

  static net(item: Item, embezzlers: number, historical = false): number {
    return new Potion(item).net(embezzlers, historical);
  }

  doublingValue(embezzlers: number, historical = false): number {
    return Math.min(
      Math.max(this.doubleDuration().net(embezzlers, historical), 0) -
        Math.max(this.net(embezzlers, historical), 0),
      this.price(true)
    );
  }

  static doublingValue(item: Item, embezzlers: number, historical = false): number {
    return new Potion(item).doublingValue(embezzlers, historical);
  }

  /**
   * Compute how many times to use this potion to cover the range of turns
   * @param turns the number of turns to cover
   * @param allowOverage whether or not to allow the potion to extend past this number of turns
   * @returns the number of uses required by this potion to cover thatrange
   */
  usesToCover(turns: number, allowOverage: boolean): number {
    if (allowOverage) {
      return Math.ceil(turns / this.effectDuration());
    } else {
      return Math.floor(turns / this.effectDuration());
    }
  }

  static usesToCover(item: Item, turns: number, allowOverage: boolean): number {
    return new Potion(item).usesToCover(turns, allowOverage);
  }

  /**
   * Compute how many fewer or more turns we are from the desired turn count based on the input usage
   * @param turns the number of turns to cover
   * @param uses the number of uses of hte potion
   * @returns negative number of the number of turns short, positive number of the number of extra turns
   */
  overage(turns: number, uses: number): number {
    return this.effectDuration() * uses - turns;
  }

  static overage(item: Item, turns: number, uses: number): number {
    return new Potion(item).overage(turns, uses);
  }

  /**
   * Compute up to 4 possible value thresholds for this potion based on the number of embezzlers to fight at the start of the day
   * - using it to only cover embezzlers
   * - using it to cover both barf and embezzlers (this is max 1 use)
   * - using it to only cover barf
   * - using it to cover turns in barf and those that would be lost at the end of the day
   * @param embezzlers The number of embezzlers expected to be fought in a block at the start of the day
   * @returns
   */
  value(
    embezzlers: number,
    turns?: number,
    limit?: number
  ): { name: PotionTier; quantity: number; value: number }[] {
    const startingTurns = haveEffect(this.effect());
    const ascending = globalOptions.ascending;
    const totalTurns = turns ?? estimatedTurns();
    const values: {
      name: PotionTier;
      quantity: number;
      value: number;
    }[] = [];
    const limitFunction = limit
      ? (quantity: number) =>
          clamp(limit - sumNumbers(values.map((tier) => tier.quantity)), 0, quantity)
      : (quantity: number) => quantity;

    // compute the value of covering embezzlers
    const embezzlerTurns = Math.max(0, embezzlers - startingTurns);
    const embezzlerQuantity = this.usesToCover(embezzlerTurns, false);
    const embezzlerValue = embezzlerQuantity ? this.gross(embezzlerTurns) : 0;

    values.push({
      name: "embezzler",
      quantity: limitFunction(embezzlerQuantity),
      value: embezzlerValue,
    });

    // compute the number of embezzlers missed before, and their value (along with barf unless nobarf)
    const overlapEmbezzlers = -this.overage(embezzlerTurns, embezzlerQuantity);

    if (overlapEmbezzlers > 0) {
      values.push({
        name: "overlap",
        quantity: limitFunction(1),
        value: this.gross(overlapEmbezzlers, globalOptions.noBarf ? overlapEmbezzlers : undefined),
      });
    }

    const embezzlerCoverage =
      embezzlerQuantity + (overlapEmbezzlers > 0 ? 1 : 0) * this.effectDuration();

    if (!globalOptions.noBarf) {
      // unless nobarf, compute the value of barf turns
      // if ascending, break those turns that are not fully covered by a potion into their own value
      const remainingTurns = Math.max(0, totalTurns - embezzlerCoverage - startingTurns);

      const barfQuantity = this.usesToCover(remainingTurns, !ascending);
      values.push({ name: "barf", quantity: limitFunction(barfQuantity), value: this.gross(0) });

      if (globalOptions.ascending && this.overage(remainingTurns, barfQuantity) <= 0) {
        const ascendingTurns = Math.max(0, remainingTurns - barfQuantity * this.effectDuration());
        values.push({
          name: "ascending",
          quantity: limitFunction(1),
          value: this.gross(0, ascendingTurns),
        });
      }
    }

    return values.filter((tier) => tier.quantity > 0);
  }

  use(quantity: number): boolean {
    if (this.useOverride) {
      return this.useOverride(quantity);
    } else if (itemType(this.potion) === "potion") {
      return use(quantity, this.potion);
    } else {
      // must provide an override for non potions, otherwise they won't use
      return false;
    }
  }
}

function useAsValuable(potion: Potion, embezzlers: number, embezzlersOnly: boolean): number {
  const value = potion.value(embezzlers);
  const price = potion.price(false);
  const amountsAcquired = value.map((value) =>
    (!embezzlersOnly || value.name === "embezzler") && value.value - price > 0
      ? acquire(value.quantity, potion.potion, value.value, false)
      : 0
  );

  const total = amountsAcquired.reduce((total, amount) => total + amount, 0);
  if (total > 0) {
    const effect = potion.effect();
    if (isSong(effect) && !have(effect)) {
      for (const song of getActiveSongs()) {
        const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
        if (!slot || slot.includes(effect)) {
          cliExecute(`shrug ${song}`);
        }
      }
    }
    print(`Using ${total} ${potion.potion.plural}`);
    potion.use(total);
  }
  return total;
}

const farmingPotions = [
  ...Item.all()
    .filter((item) => item.tradeable && !banned.includes(item) && itemType(item) === "potion")
    .map((item) => new Potion(item))
    .filter((potion) => potion.bonusMeat() > 0),
  ...$effects`Braaaaaains, Frosty`.map(
    (effect) =>
      new Potion($item`pocket wish`, {
        effect,
        canDouble: false,
        duration: 20,
        use: (quantity: number) =>
          new Array(quantity).every(() => cliExecute(`genie effect ${effect}`)),
      })
  ),
];

export function doublingPotions(embezzlers: number): Potion[] {
  return farmingPotions
    .filter((potion) => potion.doubleDuration().gross(embezzlers) / potion.price(true) > 0.5)
    .map((potion) => {
      return { potion: potion, value: potion.doublingValue(embezzlers) };
    })
    .sort((a, b) => b.value - a.value)
    .map((pair) => pair.potion);
}

/**
 * Determines if potions are worth using by comparing against meat-equilibrium. Considers using pillkeeper to double them. Accounts for non-wanderer embezzlers. Does not account for PYEC/LTC, or running out of turns with the ascend flag.
 * @param doEmbezzlers Do we account for embezzlers when deciding what potions are profitable?
 */
export function potionSetup(embezzlersOnly: boolean): void {
  // TODO: Count PYEC.
  // TODO: Count free fights (25 meat each for most).
  const embezzlers = embezzlerCount();

  if (have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed")) {
    const possibleDoublingPotions = doublingPotions(embezzlers);
    const bestPotion = possibleDoublingPotions.length > 0 ? possibleDoublingPotions[0] : undefined;
    if (bestPotion && bestPotion.doubleDuration().net(embezzlers) > pillkeeperOpportunityCost()) {
      print(`Determined that ${bestPotion.potion} was the best potion to double`, HIGHLIGHT);
      cliExecute("pillkeeper extend");
      acquire(1, bestPotion.potion, bestPotion.doubleDuration().gross(embezzlers));
      bestPotion.use(1);
    }
  }

  // Only test potions which are reasonably close to being profitable using historical price.
  const testPotions = farmingPotions.filter(
    (potion) => potion.gross(embezzlers) / potion.price(true) > 0.5
  );
  testPotions.sort((a, b) => b.net(embezzlers) - a.net(embezzlers));

  const excludedEffects = new Set<Effect>();
  for (const effect of getActiveEffects()) {
    for (const excluded of mutuallyExclusive.get(effect) ?? []) {
      excludedEffects.add(excluded);
    }
  }

  for (const potion of testPotions) {
    const effect = potion.effect();
    if (!excludedEffects.has(effect) && useAsValuable(potion, embezzlers, embezzlersOnly) > 0) {
      for (const excluded of mutuallyExclusive.get(effect) ?? []) {
        excludedEffects.add(excluded);
      }
    }
  }
}

/**
 * Uses a Greenspan iff profitable; does not account for PYEC/LTC, or running out of adventures with the ascend flag.
 * @param embezzlers Do we want to account for embezzlers when calculating the value of bathroom finance?
 */
export function bathroomFinance(embezzlers: number): void {
  if (have($effect`Buy!  Sell!  Buy!  Sell!`)) return;

  // Average meat % for embezzlers is sum of arithmetic series, 2 * sum(1 -> embezzlers)
  const averageEmbezzlerGross = ((baseMeat + 750) * 2 * (embezzlers + 1)) / 2 / 100;
  const embezzlerGross = averageEmbezzlerGross * embezzlers;
  const tourists = 100 - embezzlers;

  // Average meat % for tourists is sum of arithmetic series, 2 * sum(embezzlers + 1 -> 100)
  const averageTouristGross = (baseMeat * 2 * (100 + embezzlers + 1)) / 2 / 100;
  const touristGross = averageTouristGross * tourists;

  const greenspan = $item`Uncle Greenspan's Bathroom Finance Guide`;
  if (touristGross + embezzlerGross > mallPrice(greenspan)) {
    acquire(1, greenspan, touristGross + embezzlerGross, false);
    if (itemAmount(greenspan) > 0) {
      print(`Using ${greenspan}!`, HIGHLIGHT);
      use(greenspan);
    }
  }
}
