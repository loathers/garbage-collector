import "core-js/modules/es.object.from-entries";
import {
  Effect,
  effectModifier,
  haveEffect,
  historicalAge,
  historicalPrice,
  Item,
  itemType,
  mallPrice,
  use,
} from "kolmafia";
import { $familiar, $item, clamp, getModifier, have, sum } from "libram";
import { acquire } from "../acquire";
import { baseMeat, retrieveUntradeablePrice } from "../lib";
import { usingPurse } from "../outfit";
import { estimatedGarboTurns } from "../turns";
import { globalOptions } from "../config";

export interface PotionOptions {
  providesDoubleDuration?: boolean;
  canDouble?: boolean;
  effect?: Effect;
  duration?: number;
  price?: (historical: boolean) => number;
  use?: (quantity: number) => boolean;
  acquire?: (
    qty: number,
    item: Item,
    maxPrice?: number | undefined,
    throwOnFail?: boolean,
    maxAggregateCost?: number | undefined,
    tryRetrievingUntradeable?: boolean,
  ) => number;
}

export type PotionTier = "embezzler" | "overlap" | "barf" | "ascending";

export const failedWishes: Effect[] = [];

export class Potion {
  potion: Item;
  providesDoubleDuration?: boolean;
  canDouble: boolean;
  overrideEffect?: Effect;
  overrideDuration?: number;
  priceOverride?: (historical: boolean) => number;
  useOverride?: (quantity: number) => boolean;
  acquire: (
    qty: number,
    item: Item,
    maxPrice?: number | undefined,
    throwOnFail?: boolean,
    maxAggregateCost?: number | undefined,
    tryRetrievingUntradeable?: boolean,
  ) => number;

  constructor(potion: Item, options: PotionOptions = {}) {
    this.potion = potion;
    this.providesDoubleDuration = options.providesDoubleDuration;
    this.canDouble = options.canDouble ?? true;
    this.overrideDuration = options.duration;
    this.overrideEffect = options.effect;
    this.priceOverride = options.price;
    this.useOverride = options.use;
    this.acquire = options.acquire ?? acquire;
  }

  doubleDuration(): Potion {
    if (this.canDouble) {
      return new Potion(this.potion, {
        providesDoubleDuration: true,
        canDouble: this.canDouble,
        duration: this.overrideDuration,
        effect: this.overrideEffect,
        price: this.priceOverride,
        use: this.useOverride,
        acquire: this.acquire,
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
      Math.min(duration, embezzlers - haveEffect(this.effect())),
      0,
    );

    return (bonusMeat / 100) * (baseMeat * duration + 750 * embezzlersApplied);
  }

  static gross(item: Item, embezzlers: number): number {
    return new Potion(item).gross(embezzlers);
  }

  price(historical: boolean): number {
    if (this.priceOverride) return this.priceOverride(historical);
    // If asked for historical, and age < 14 days, use historical.
    // If potion is not tradeable, use retrievePrice instead
    return this.potion.tradeable
      ? historical && historicalAge(this.potion) < 14
        ? historicalPrice(this.potion)
        : mallPrice(this.potion)
      : retrieveUntradeablePrice(this.potion);
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
      this.price(true),
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
    limit?: number,
  ): { name: PotionTier; quantity: number; value: number }[] {
    const startingTurns = haveEffect(this.effect());
    const ascending = globalOptions.ascend;
    const totalTurns = turns ?? estimatedGarboTurns();
    const values: {
      name: PotionTier;
      quantity: number;
      value: number;
    }[] = [];
    const limitFunction = limit
      ? (quantity: number) => clamp(limit - sum(values, ({ quantity }) => quantity), 0, quantity)
      : (quantity: number) => quantity;

    // compute the value of covering embezzlers
    const embezzlerTurns = Math.max(0, embezzlers - startingTurns);
    const embezzlerQuantity = this.usesToCover(embezzlerTurns, false);
    const embezzlerValue = embezzlerQuantity ? this.gross(embezzlers) : 0;

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
        value: this.gross(overlapEmbezzlers, globalOptions.nobarf ? overlapEmbezzlers : undefined),
      });
    }

    const embezzlerCoverage =
      embezzlerQuantity + (overlapEmbezzlers > 0 ? 1 : 0) * this.effectDuration();

    if (!globalOptions.nobarf) {
      // unless nobarf, compute the value of barf turns
      // if ascending, break those turns that are not fully covered by a potion into their own value
      const remainingTurns = Math.max(0, totalTurns - embezzlerCoverage - startingTurns);

      const barfQuantity = this.usesToCover(remainingTurns, !ascending);
      values.push({ name: "barf", quantity: limitFunction(barfQuantity), value: this.gross(0) });

      if (ascending && this.overage(remainingTurns, barfQuantity) < 0) {
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

  private _use(quantity: number): boolean {
    if (this.useOverride) {
      return this.useOverride(quantity);
    } else if (itemType(this.potion) === "potion") {
      return use(quantity, this.potion);
    } else {
      // must provide an override for non potions, otherwise they won't use
      return false;
    }
  }

  use(quantity: number): boolean {
    const effectTurns = haveEffect(this.effect());
    const result = this._use(quantity);
    // If we tried wishing but failed, no longer try this wish in the future
    if (this.potion === $item`pocket wish` && haveEffect(this.effect()) <= effectTurns) {
      failedWishes.push(this.effect());
    }
    return result;
  }
}
