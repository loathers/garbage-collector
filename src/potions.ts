import {
  effectModifier,
  numericModifier,
  print,
  historicalAge,
  historicalPrice,
  mallPrice,
  itemType,
  haveEffect,
  cliExecute,
  itemAmount,
  myAdventures,
  use,
} from "kolmafia";
import { have, $familiar, get, $item } from "libram";
import { acquire } from "./acquire";
import { embezzlerCount } from "./fights";
import { baseMeat } from "./mood";

class Potion {
  potion: Item;

  constructor(potion: Item) {
    this.potion = potion;
  }

  effect() {
    return effectModifier(this.potion, "Effect");
  }

  effectDuration() {
    return numericModifier(this.potion, "Effect Duration");
  }

  meatDrop() {
    return numericModifier(this.effect(), "Meat Drop");
  }

  familiarWeight() {
    return numericModifier(this.effect(), "Familiar Weight");
  }

  bonusMeat() {
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
    print(`Marginal value of familiar weight: ${marginalValue.toFixed(2)}`);

    return this.familiarWeight() * marginalValue + this.meatDrop();
  }

  gross(embezzlers: number, doubleDuration = false) {
    const bonusMeat = this.bonusMeat();
    const duration = this.effectDuration() * (doubleDuration ? 2 : 1);
    // Number of embezzlers this will actually be in effect for.
    const embezzlersApplied = Math.max(
      Math.min(duration, embezzlers) - haveEffect(this.effect()),
      0
    );

    return (bonusMeat / 100) * (baseMeat * duration + 750 * embezzlersApplied);
  }

  price(historical: boolean) {
    // If asked for historical, and age < 14 days, use historical.
    return historical && historicalAge(this.potion) < 14
      ? historicalPrice(this.potion)
      : mallPrice(this.potion);
  }

  net(embezzlers: number, doubleDuration = false, historical = false) {
    return this.gross(embezzlers, doubleDuration) - this.price(historical);
  }

  doublingValue(embezzlers: number, historical = false) {
    return (
      Math.max(this.net(embezzlers, true, historical), 0) -
      Math.max(this.net(embezzlers, false, historical), 0)
    );
  }

  useAsValuable(embezzlers: number, doubleDuration = false) {
    const duration = this.effectDuration() * (doubleDuration ? 2 : 1);

    let quantityToUse = 0;
    let embezzlersRemaining = embezzlers - haveEffect(this.effect());
    let keepGoing = true;

    const embezzlerQuantity = Math.floor(embezzlersRemaining / duration);
    if (this.net(embezzlersRemaining, doubleDuration) > 0 && embezzlerQuantity > 0) {
      acquire(
        embezzlerQuantity,
        this.potion,
        this.gross(embezzlersRemaining, doubleDuration),
        false
      );
      quantityToUse = Math.max(embezzlerQuantity, itemAmount(this.potion));
      embezzlersRemaining -= quantityToUse * duration;
    }
    if (quantityToUse < embezzlerQuantity || (doubleDuration && quantityToUse > 0))
      keepGoing = false;

    // Now, is there one with both embezzlers and non-embezzlers?
    if (keepGoing && this.net(embezzlersRemaining, doubleDuration) > 0 && embezzlersRemaining > 0) {
      acquire(1, this.potion, this.gross(embezzlersRemaining, doubleDuration), false);
      const additional = Math.max(1, itemAmount(this.potion) - quantityToUse);
      quantityToUse += additional;
      embezzlersRemaining = Math.max(embezzlersRemaining - additional * duration, 0);
    }
    if (embezzlersRemaining > 0 || (doubleDuration && quantityToUse > 0)) keepGoing = false;

    // How many should we use with non-embezzlers?
    if (keepGoing && this.net(0, doubleDuration)) {
      const adventureCap = myAdventures() * 1.04 + 50;
      const touristQuantity = Math.ceil(
        adventureCap - haveEffect(this.effect()) - quantityToUse * duration
      );
      acquire(touristQuantity, this.potion, this.gross(0, doubleDuration), false);
      const additional = Math.max(touristQuantity, itemAmount(this.potion) - quantityToUse);
      quantityToUse += additional;
    }

    if (quantityToUse > 0) {
      if (doubleDuration) quantityToUse = 1;
      use(quantityToUse, this.potion);
    }
  }
}

export function potionSetup(): void {
  // TODO: Count PYEC.
  const embezzlers = embezzlerCount();
  const potions = Item.all().filter((item) => item.tradeable && itemType(item) === "potion");
  const meatPotions = potions
    .map((item) => new Potion(item))
    .filter((potion) => potion.bonusMeat() > 0);

  if (have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed")) {
    const testPotionsDoubled = meatPotions.filter(
      (potion) => potion.gross(embezzlers, true) / potion.price(true) > 0.5
    );
    testPotionsDoubled.sort((x, y) => -(x.doublingValue(embezzlers) - y.doublingValue(embezzlers)));
    if (testPotionsDoubled.length > 0) {
      const potion = testPotionsDoubled[0];
      // Estimate that the opportunity cost of free PK useage is
      if (potion.doublingValue(embezzlers) > 10000) {
        cliExecute("pillkeeper extend");
        potion.useAsValuable(embezzlers, true);
      }
    }
  }

  const testPotions = meatPotions.filter(
    (potion) => potion.gross(embezzlers) / potion.price(true) > 0.5
  );
  testPotions.sort((x, y) => -(x.net(embezzlers) - y.net(embezzlers)));

  for (const potion of testPotions) {
    potion.useAsValuable(embezzlers);
  }
}
