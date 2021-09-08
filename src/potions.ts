import "core-js/modules/es.object.from-entries";
import { canAdv } from "canadv.ash";
import {
  cliExecute,
  effectModifier,
  haveEffect,
  historicalAge,
  historicalPrice,
  itemAmount,
  itemType,
  mallPrice,
  numericModifier,
  print,
  use,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  get,
  getActiveEffects,
  have,
} from "libram";
import { acquire } from "./acquire";
import { baseMeat } from "./lib";
import { embezzlerCount, estimatedTurns } from "./embezzler";

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
    let embezzlersRemaining = Math.max(embezzlers - haveEffect(this.effect()), 0);
    let keepGoing = true;

    // Use however many will land entirely on embezzler turns.
    const embezzlerQuantity = Math.floor(embezzlersRemaining / duration);
    if (this.net(embezzlersRemaining, doubleDuration) > 0 && embezzlerQuantity > 0) {
      acquire(
        embezzlerQuantity,
        this.potion,
        this.gross(embezzlersRemaining, doubleDuration),
        false
      );
      quantityToUse = Math.min(embezzlerQuantity, itemAmount(this.potion));
      print(
        `Determined that ${quantityToUse} ${
          this.potion.plural
        } are profitable on embezzlers: net value ${this.net(
          embezzlersRemaining,
          doubleDuration
        ).toFixed(0)}.`,
        "blue"
      );
      embezzlersRemaining -= quantityToUse * duration;
    }
    if (quantityToUse < embezzlerQuantity || (doubleDuration && quantityToUse > 0)) {
      keepGoing = false;
    }

    // Now, is there one with both embezzlers and non-embezzlers?
    if (keepGoing && this.net(embezzlersRemaining, doubleDuration) > 0 && embezzlersRemaining > 0) {
      acquire(1, this.potion, this.gross(embezzlersRemaining, doubleDuration), false);
      const additional = Math.min(1, itemAmount(this.potion) - quantityToUse);
      print(
        `Determined that ${additional} ${
          this.potion.plural
        } are profitable on partial embezzlers: net value ${this.net(
          embezzlersRemaining,
          doubleDuration
        ).toFixed(0)}.`,
        "blue"
      );
      quantityToUse += additional;
      embezzlersRemaining = Math.max(embezzlersRemaining - additional * duration, 0);
    }
    if (embezzlersRemaining > 0 || (doubleDuration && quantityToUse > 0)) keepGoing = false;

    // How many should we use with non-embezzlers?
    if (keepGoing && this.net(0, doubleDuration) > 0) {
      const adventureCap = estimatedTurns();
      const tourists = adventureCap - haveEffect(this.effect()) - quantityToUse * duration;
      if (tourists > 0) {
        const touristQuantity = Math.ceil(tourists / duration);
        acquire(touristQuantity, this.potion, this.gross(0, doubleDuration), false);
        const additional = Math.min(touristQuantity, itemAmount(this.potion) - quantityToUse);
        print(
          `Determined that ${additional} ${
            this.potion.plural
          } are profitable on tourists: net value ${this.net(0, doubleDuration).toFixed(0)}.`,
          "blue"
        );
        quantityToUse += additional;
      }
    }

    if (quantityToUse > 0) {
      if (doubleDuration) quantityToUse = 1;
      use(quantityToUse, this.potion);
    }
  }
}

export function potionSetup(doEmbezzlers = false): void {
  // TODO: Count PYEC.
  // TODO: Count free fights (25 meat each for most).
  const embezzlers = doEmbezzlers ? embezzlerCount() : 0;
  const potions = Item.all().filter(
    (item) => item.tradeable && !banned.includes(item) && itemType(item) === "potion"
  );
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
      // Estimate that the opportunity cost of free PK useage is 10k meat - approximately +1 embezzler.
      if (
        potion.doublingValue(embezzlers) >
        (canAdv($location`Cobb's Knob Treasury`, false) ? 15000 : 0)
      ) {
        cliExecute("pillkeeper extend");
        print(
          `Best doubling potion: ${potion.potion.name}, value ${potion
            .doublingValue(embezzlers)
            .toFixed(0)}`,
          "blue"
        );
        potion.useAsValuable(embezzlers, true);
      }
    }
  }

  // Only test potions which are reasonably close to being profitable using historical price.
  const testPotions = meatPotions.filter(
    (potion) => potion.gross(embezzlers) / potion.price(true) > 0.5
  );
  testPotions.sort((x, y) => -(x.net(embezzlers) - y.net(embezzlers)));

  const excludedEffects = new Set<Effect>();
  for (const effect of getActiveEffects()) {
    for (const excluded of mutuallyExclusive.get(effect) ?? []) {
      excludedEffects.add(excluded);
    }
  }

  for (const potion of testPotions) {
    const effect = potion.effect();
    if (excludedEffects.has(effect)) continue;
    potion.useAsValuable(embezzlers);
    if (have(effect)) {
      for (const excluded of mutuallyExclusive.get(effect) ?? []) {
        excludedEffects.add(excluded);
      }
    }
  }
}

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
    print(`Using Uncle Greenspan's guide!`, "blue");
    acquire(1, greenspan, touristGross + embezzlerGross);
    if (itemAmount(greenspan) > 0) use(greenspan);
  }
}
