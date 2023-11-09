import { Outfit } from "grimoire-kolmafia";
import {
  $familiar,
  $item,
  $items,
  get,
  getSaleValue,
  have,
  maxBy,
  set,
  sum,
  withChoice,
} from "libram";
import {
  canEquip,
  getOutfits,
  holiday,
  mallPrice,
  outfitPieces,
  outfitTreats,
  print,
  runChoice,
  toItem,
  use,
  visitUrl,
} from "kolmafia";
import { GarboTask } from "../tasks/engine";
import { garboValue } from "../garboValue";
import { acquire } from "../acquire";
import { GarboStrategy, Macro } from "../combat";
import { freeFightOutfit } from "../outfit";
import { globalOptions } from "../config";

const HOUSE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const checkedHousesForTricking: number[] = [];
let blockHtml = "";
function getBlockHtml(): string {
  blockHtml ||= visitUrl("place.php?whichplace=town&action=town_trickortreat");
  return blockHtml;
}

const trickHats = $items`invisible bag, witch hat, beholed bedsheet, wolfman mask, pumpkinhead mask, mummy costume`;

function treatValue(outfit: string): number {
  return sum(
    Object.entries(outfitTreats(outfit)),
    ([candyName, probability]) => probability * garboValue(toItem(candyName)),
  );
}

export function getTreatOutfit(): string {
  const availableOutfits = getOutfits().filter((name) =>
    outfitPieces(name).every((piece) => canEquip(piece)),
  );
  if (!availableOutfits.length) {
    print(
      "You don't seem to actually have any trick-or-treating outfits available, my friend!",
    );
  }
  return maxBy(availableOutfits, treatValue);
}

export function treatOutfit(): Outfit {
  const outfit = new Outfit();
  const bestTreatOutfit = getTreatOutfit();
  const pieces = outfitPieces(bestTreatOutfit);
  for (const piece of pieces) {
    if (!outfit.equip(piece)) {
      print(
        `Could not equip all pieces of trick-or-treating outfit ${bestTreatOutfit}: aborted on ${piece}`,
      );
    }
  }

  outfit.equip($familiar`Trick-or-Treating Tot`);
  return outfit;
}

export function candyRichBlockValue(): number {
  const outfitCandyValue = treatValue(getTreatOutfit());
  const totOutfitCandyMultiplier = have($familiar`Trick-or-Treating Tot`)
    ? 1.6
    : 1;
  const bowlValue = (1 / 5) * getSaleValue($item`huge bowl of candy`);
  const prunetsValue = have($familiar`Trick-or-Treating Tot`)
    ? 4 * 0.2 * getSaleValue($item`Prunets`)
    : 0;

  const outfitCandyTotal = 3 * outfitCandyValue * totOutfitCandyMultiplier;
  return (
    outfitCandyTotal +
    bowlValue +
    prunetsValue +
    5 * globalOptions.prefs.valueOfFreeFight
  );
}

function shouldAcquireCandyMap(): boolean {
  return (
    !holiday().includes("Halloween") &&
    mallPrice($item`map to a candy-rich block`) < 50000 && // Sanity value to prevent mall shenanigans
    candyRichBlockValue() > mallPrice($item`map to a candy-rich block`)
  );
}

function useCandyMapTask(): GarboTask {
  return {
    name: "Acquire Candy Map",
    ready: () => shouldAcquireCandyMap(),
    completed: () => get("_mapToACandyRichBlockUsed"),
    do: (): void => {
      if (
        acquire(
          1,
          $item`map to a candy-rich block`,
          candyRichBlockValue() - 1,
          false,
        )
      ) {
        withChoice(804, 2, () => use($item`map to a candy-rich block`));
        set("_mapToACandyRichBlockUsed", "true");
      }
    },
    limit: { skip: 1 },
    spendsTurn: false,
  };
}

let treated = false;
function doCandyTreat(): GarboTask {
  return {
    name: "Treat",
    completed: () => treated,
    ready: () =>
      !holiday().includes("Halloween") && get("_mapToACandyRichBlockUsed"),
    outfit: treatOutfit,
    do: (): void => {
      // We do all treat houses in a row as one task for speed reasons
      for (const house of HOUSE_NUMBERS) {
        if (getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?house_l`))) {
          checkedHousesForTricking.push(house);
          visitUrl(
            `choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`,
          );
        } else if (
          getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?starhouse`))
        ) {
          checkedHousesForTricking.push(house);
          visitUrl(
            `choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`,
          );
          runChoice(2);
          visitUrl(`place.php?whichplace=town&action=town_trickortreat`);
        }
      }
      treated = true;
    },
    spendsTurn: false,
    combat: new GarboStrategy(() => Macro.abort()),
  };
}

const MAX_HAT_PRICE = 100_000;
function obtainTrickHat(): GarboTask {
  return {
    name: "Obtain Trick Hat",
    completed: () => trickHats.some((hat) => have(hat)),
    ready: () => trickHats.some((hat) => mallPrice(hat) < MAX_HAT_PRICE),
    do: () => {
      const cheapestHat = maxBy(trickHats, mallPrice, true);
      acquire(1, cheapestHat, MAX_HAT_PRICE);
    },
    spendsTurn: false,
  };
}

export function candyMapDailyTasks(): GarboTask[] {
  return [useCandyMapTask(), doCandyTreat(), obtainTrickHat()];
}

export function doCandyTrick(): GarboTask {
  return {
    name: "Trick",
    completed: () => checkedHousesForTricking.length >= HOUSE_NUMBERS.length,
    ready: () =>
      !holiday().includes("Halloween") &&
      get("_mapToACandyRichBlockUsed") &&
      trickHats.some((hat) => have(hat)),
    do: (): void => {
      for (const house of HOUSE_NUMBERS) {
        if (checkedHousesForTricking.includes(house)) continue;
        checkedHousesForTricking.push(house);
        if (getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?house_d`))) {
          visitUrl(`place.php?whichplace=town&action=town_trickortreat`);
          visitUrl(
            `choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`,
          );
          return;
        }
      }
    },
    outfit: (): Outfit => {
      const hat = trickHats.find((hat) => have(hat));
      if (!hat) {
        throw new Error(
          "We thought we had an appropriate hat for tricking, but we did not.",
        );
      }
      return freeFightOutfit({ hat });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}
