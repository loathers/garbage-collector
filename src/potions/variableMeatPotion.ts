import "core-js/modules/es.object.from-entries";
import {
  availableAmount,
  Effect,
  effectModifier,
  haveEffect,
  historicalAge,
  historicalPrice,
  Item,
  mallPrice,
  numericModifier,
  print,
  retrievePrice,
  use,
} from "kolmafia";
import { maxBy } from "libram";
import { acquire } from "../acquire";
import { baseMeat, retrieveUntradeablePrice, turnsToNC } from "../lib";
import { estimatedGarboTurns } from "../turns";
import { globalOptions } from "../config";

function triangleNumber(b: number, a = 0) {
  return 0.5 * (b * (b + 1) - a * (a + 1));
}

export class VariableMeatPotion {
  potion: Item;
  effect: Effect;
  duration: number;
  softcap: number; // Number of turns to cap out variable bonus
  meatBonusPerTurn: number; // meat% bonus per turn
  cappedMeatBonus: number;

  constructor(
    potion: Item,
    softcap: number,
    meatBonusPerTurn: number,
    duration?: number,
    effect?: Effect,
  ) {
    this.potion = potion;
    this.effect = effect ?? effectModifier(potion, "Effect");
    this.duration = duration ?? numericModifier(potion, "Effect Duration");
    this.softcap = softcap;
    this.meatBonusPerTurn = meatBonusPerTurn;
    this.cappedMeatBonus = softcap * meatBonusPerTurn;
  }

  use(quantity: number): boolean {
    acquire(
      quantity,
      this.potion,
      (1.2 * retrievePrice(this.potion, quantity)) / quantity,
      false,
      2000000,
    );
    if (availableAmount(this.potion) < quantity) return false;
    return use(quantity, this.potion);
  }

  price(historical: boolean): number {
    // If asked for historical, and age < 14 days, use historical.
    // If potion is not tradeable, use retrievePrice instead
    return this.potion.tradeable
      ? historical && historicalAge(this.potion) < 14
        ? historicalPrice(this.potion)
        : mallPrice(this.potion)
      : retrieveUntradeablePrice(this.potion);
  }

  getOptimalNumberToUse(yachtzees: number, embezzlers: number): number {
    const barfTurns = Math.max(0, estimatedGarboTurns() - yachtzees - embezzlers);

    const potionAmountsToConsider: number[] = [];
    const considerSoftcap = [0, this.softcap];
    const considerEmbezzlers = embezzlers > 0 ? [0, embezzlers] : [0];
    for (const fn of [Math.floor, Math.ceil]) {
      for (const sc of considerSoftcap) {
        for (const em of considerEmbezzlers) {
          const considerBarfTurns = em === embezzlers && barfTurns > 0 ? [0, barfTurns] : [0];
          for (const bt of considerBarfTurns) {
            const potionAmount = fn((yachtzees + em + bt + sc) / this.duration);
            if (!potionAmountsToConsider.includes(potionAmount)) {
              potionAmountsToConsider.push(potionAmount);
            }
          }
        }
      }
    }

    const profitsFromPotions = potionAmountsToConsider.map((quantity) => ({
      quantity,
      value: this.valueNPotions(quantity, yachtzees, embezzlers, barfTurns),
    }));
    const bestOption = maxBy(profitsFromPotions, "value");

    if (bestOption.value > 0) {
      print(
        `Expected to profit ${bestOption.value.toFixed(2)} from ${bestOption.quantity} ${
          this.potion.plural
        }`,
        "blue",
      );
      const ascendingOverlap =
        globalOptions.ascend || globalOptions.nobarf ? 0 : this.softcap / this.duration;
      const potionsToUse =
        bestOption.quantity +
        ascendingOverlap -
        Math.floor(haveEffect(this.effect) / this.duration);

      return Math.max(potionsToUse, 0);
    }
    return 0;
  }

  valueNPotions(n: number, yachtzees: number, embezzlers: number, barfTurns: number): number {
    const yachtzeeValue = 2000;
    const embezzlerValue = baseMeat + 750;
    const barfValue = (baseMeat * turnsToNC) / 30;

    const totalCosts = retrievePrice(this.potion, n);
    const totalDuration = n * this.duration;
    let cappedDuration = Math.max(0, totalDuration - this.softcap + 1);
    let decayDuration = Math.min(totalDuration, this.softcap - 1);
    let totalValue = 0;
    const turnTypes = [
      [yachtzees, yachtzeeValue],
      [embezzlers, embezzlerValue],
      [barfTurns, barfValue],
    ];

    for (const [turns, value] of turnTypes) {
      const cappedTurns = Math.min(cappedDuration, turns);
      const decayTurns = Math.min(decayDuration, turns - cappedTurns);
      totalValue +=
        (value *
          (cappedTurns * this.cappedMeatBonus +
            triangleNumber(decayDuration, decayDuration - decayTurns) * this.meatBonusPerTurn)) /
        100;
      cappedDuration -= cappedTurns;
      decayDuration -= decayTurns;
      if (decayDuration === 0) break;
    }

    return totalValue - totalCosts;
  }
}
