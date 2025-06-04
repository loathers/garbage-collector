import { Outfit } from "grimoire-kolmafia";
import {
  $familiar,
  $item,
  $items,
  get,
  getSaleValue,
  have,
  maxBy,
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
import { Macro } from "../combat";
import { freeFightOutfit } from "../outfit";
import { globalOptions } from "../config";
import { GarboStrategy } from "../combatStrategy";

const trickHats = $items`invisible bag, witch hat, beholed bedsheet, wolfman mask, pumpkinhead mask, mummy costume`;
const visitBlock = () =>
  visitUrl(`place.php?whichplace=town&action=town_trickortreat`);
const visitHouse = (house: number) =>
  runChoice(3, `whichhouse=${house.toFixed(0)}`);

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
      }
    },
    limit: { skip: 1 },
    spendsTurn: false,
  };
}

function doCandyTreat(): GarboTask {
  return {
    name: "Treat",
    completed: () =>
      !["L", "S"].some((house) => get("_trickOrTreatBlock").includes(house)),
    ready: () =>
      !holiday().includes("Halloween") && get("_mapToACandyRichBlockUsed"),
    outfit: treatOutfit,
    do: (): void => {
      visitBlock();

      const houses = [...get("_trickOrTreatBlock").split("").entries()].filter(
        ([, house]) => ["L", "S"].includes(house),
      );
      // We do all treat houses in a row as one task for speed reasons
      for (const [index, house] of houses) {
        if (["L", "S"].includes(house)) {
          visitHouse(index);
          if (house === "S") {
            runChoice(2);
            visitBlock();
          }
        }
      }
    },
    spendsTurn: false,
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "We were planning on Treating, but we've been Tricked!",
      ),
    ),
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
    completed: () => !get("_trickOrTreatBlock").includes("D"),
    ready: () =>
      !holiday().includes("Halloween") &&
      get("_mapToACandyRichBlockUsed") &&
      trickHats.some((hat) => have(hat)),
    do: (): void => {
      visitBlock();
      const houseNumber = get("_trickOrTreatBlock").indexOf("D");
      if (houseNumber < 0) return;
      visitHouse(houseNumber);
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
