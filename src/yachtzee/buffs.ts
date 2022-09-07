import {
  cliExecute,
  Effect,
  haveEffect,
  itemAmount,
  maximize,
  myMeat,
  print,
  toInt,
  use,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  clamp,
  get,
  getActiveEffects,
  getActiveSongs,
  have,
  isSong,
  Mood,
  set,
} from "libram";
import { acquire } from "../acquire";
import { withStash } from "../clan";
import { baseMeat, burnLibrams, turnsToNC } from "../lib";
import { farmingPotions, mutuallyExclusive, Potion, variableMeatPotionsSetup } from "../potions";
import { garboValue } from "../session";
import { executeNextDietStep } from "./diet";
import { expectedEmbezzlers, pyecAvailable, shrugIrrelevantSongs } from "./lib";

function yachtzeePotionProfits(potion: Potion, yachtzeeTurns: number): number {
  // If we have an unused PYEC then
  // 1) If we don't have an effect, +5 to gained effect duration
  // 2) If we already have an effect, +5 to existing effect duration
  // This means that the first use of a potion that we don't already have an effect of is more valuable than the next use
  const PYECOffset = pyecAvailable() ? 5 : 0;
  const existingOffset = haveEffect(potion.effect()) ? PYECOffset : 0;
  const extraOffset = PYECOffset - existingOffset;
  const effectiveYachtzeeTurns = Math.max(
    Math.min(
      yachtzeeTurns - haveEffect(potion.effect()) - existingOffset,
      potion.effectDuration() + extraOffset
    ),
    0
  );
  const embezzlerTurns = Math.min(
    expectedEmbezzlers,
    Math.max(potion.effectDuration() + extraOffset - effectiveYachtzeeTurns, 0)
  );
  const barfTurns = Math.max(
    potion.effectDuration() + extraOffset - effectiveYachtzeeTurns - embezzlerTurns,
    0
  );
  const embezzlerValue = embezzlerTurns > 0 ? potion.gross(embezzlerTurns) : 0;
  const yachtzeeValue =
    (effectiveYachtzeeTurns * 2000 * (potion.meatDrop() + 2.5 * potion.familiarWeight())) / 100; // Every 1lbs of lep ~ 2.5% meat drop
  const barfValue = (barfTurns * baseMeat * turnsToNC) / (turnsToNC + 1);

  return yachtzeeValue + embezzlerValue + barfValue - potion.price(true);
}

export function yachtzeePotionSetup(yachtzeeTurns: number, simOnly?: boolean): number {
  let totalProfits = 0;
  const PYECOffset = pyecAvailable() ? 5 : 0;
  const excludedEffects = new Set<Effect>();

  shrugIrrelevantSongs();

  if (have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed", false)) {
    const doublingPotions = farmingPotions
      .filter(
        (potion) =>
          potion.canDouble &&
          haveEffect(potion.effect()) + PYECOffset * (have(potion.effect()) ? 1 : 0) <
            yachtzeeTurns &&
          yachtzeePotionProfits(potion.doubleDuration(), yachtzeeTurns) > 0 &&
          potion.price(true) < myMeat()
      )
      .sort(
        (left, right) =>
          yachtzeePotionProfits(right.doubleDuration(), yachtzeeTurns) -
          yachtzeePotionProfits(left.doubleDuration(), yachtzeeTurns)
      );
    const bestPotion = doublingPotions.length > 0 ? doublingPotions[0].doubleDuration() : undefined;
    if (bestPotion) {
      const profit = yachtzeePotionProfits(bestPotion, yachtzeeTurns);
      const price = bestPotion.price(true);
      totalProfits += profit;
      print(`Determined that ${bestPotion.potion} was the best potion to double`, "blue");
      print(
        `Expected to profit ${profit} meat from doubling 1 ${bestPotion.potion} @ price ${price} meat`,
        "blue"
      );
      if (!simOnly) {
        cliExecute("pillkeeper extend");
        acquire(1, bestPotion.potion, profit + price);
        bestPotion.use(1);
      } else excludedEffects.add(bestPotion.effect());
    }
  }

  for (const effect of getActiveEffects()) {
    for (const excluded of mutuallyExclusive.get(effect) ?? []) {
      excludedEffects.add(excluded);
    }
  }

  const testPotions = farmingPotions
    .filter(
      (potion) =>
        haveEffect(potion.effect()) + PYECOffset * toInt(haveEffect(potion.effect()) > 0) <
          yachtzeeTurns && yachtzeePotionProfits(potion, yachtzeeTurns) > 0
    )
    .sort(
      (left, right) =>
        yachtzeePotionProfits(right, yachtzeeTurns) - yachtzeePotionProfits(left, yachtzeeTurns)
    );

  for (const potion of testPotions) {
    const effect = potion.effect();
    const price = potion.price(true);
    if (
      haveEffect(effect) + PYECOffset * toInt(haveEffect(effect) > 0) >= yachtzeeTurns ||
      price > myMeat()
    ) {
      continue;
    }
    if (!excludedEffects.has(effect)) {
      let tries = 0;
      while (haveEffect(effect) + PYECOffset * toInt(haveEffect(effect) > 0) < yachtzeeTurns) {
        tries++;
        print(`Considering effect ${effect} from source ${potion.potion}`, "blue");
        const profit = yachtzeePotionProfits(potion, yachtzeeTurns);
        if (profit < 0) break;
        const nPotions = have(effect)
          ? clamp(
              Math.floor(
                (yachtzeeTurns - haveEffect(effect) - PYECOffset) / potion.effectDuration()
              ),
              1,
              Math.max(1, yachtzeeTurns - PYECOffset)
            )
          : 1;

        totalProfits += nPotions * profit;
        print(
          `Expected to profit ${nPotions * profit} meat from using ${nPotions} ${
            potion.potion
          } @ price ${price} meat each`,
          "blue"
        );
        if (!simOnly) {
          acquire(nPotions, potion.potion, profit + price, false);
          if (itemAmount(potion.potion) < 1) break;
          if (isSong(effect) && !have(effect)) {
            for (const song of getActiveSongs()) {
              const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
              if (!slot || slot.includes(effect)) {
                cliExecute(`shrug ${song}`);
              }
            }
          }
          if (
            !potion.use(Math.min(itemAmount(potion.potion), nPotions)) ||
            tries >= 5 * Math.ceil(yachtzeeTurns / potion.effectDuration())
          ) {
            break;
          }
        } else break;
      }
      if (have(effect) || simOnly) {
        for (const excluded of mutuallyExclusive.get(effect) ?? []) {
          excludedEffects.add(excluded);
        }
      }
    }
  }

  if (!simOnly) {
    variableMeatPotionsSetup(yachtzeeTurns, expectedEmbezzlers);
    executeNextDietStep(true);
    if (pyecAvailable()) {
      maximize("MP", false);
      if (have($item`Platinum Yendorian Express Card`)) {
        burnLibrams(200);
        use($item`Platinum Yendorian Express Card`);
      } else {
        withStash($items`Platinum Yendorian Express Card`, () => {
          if (have($item`Platinum Yendorian Express Card`)) {
            burnLibrams(200);
            use($item`Platinum Yendorian Express Card`);
          }
        });
      }
    }
    if (have($item`License to Chill`) && !get("_licenseToChillUsed")) {
      burnLibrams(200);
      use($item`License to Chill`);
    }
    if (!get("_bagOTricksUsed")) {
      withStash($items`Bag o' Tricks`, () => {
        burnLibrams(200);
        use($item`Bag o' Tricks`);
      });
    }
    burnLibrams(200);
    set("_PYECAvailable", false);
  }

  // Uncle Greenspan's may be cost effective
  if (!simOnly && !have($effect`Buy!  Sell!  Buy!  Sell!`)) {
    const yachtzeeFactor = yachtzeeTurns * (yachtzeeTurns + 1);
    const embezzlerFactor =
      Math.min(100, expectedEmbezzlers + yachtzeeTurns) *
      (Math.min(100, expectedEmbezzlers + yachtzeeTurns) + 1);
    const greenspanValue =
      (2000 * yachtzeeFactor +
        (baseMeat + 750) * (embezzlerFactor - yachtzeeFactor) +
        baseMeat * (10100 - embezzlerFactor)) /
      100;
    const price = garboValue($item`Uncle Greenspan's Bathroom Finance Guide`);
    const profit = greenspanValue - price;
    if (profit > 0) {
      print(
        `Expected to profit ${profit} meat from using 1 Uncle Greenspan's Bathroom Finance Guide @ price ${price} meat`,
        "blue"
      );
      acquire(1, $item`Uncle Greenspan's Bathroom Finance Guide`, greenspanValue, false);
      if (have($item`Uncle Greenspan's Bathroom Finance Guide`)) {
        use(1, $item`Uncle Greenspan's Bathroom Finance Guide`);
      }
    }
  }
  return totalProfits;
}
