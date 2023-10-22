import { Outfit } from "grimoire-kolmafia";
import { $familiar, $item, get, getSaleValue, have, maxBy, sum } from "libram";
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

const HOUSE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

let blockHtml = "";

function getBlockHtml(): string {
  blockHtml ||= visitUrl("place.php?whichplace=town&action=town_trickortreat");
  return blockHtml;
}

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
  return outfitCandyTotal + bowlValue + prunetsValue;
}

function shouldAcquireCandyMap(): boolean {
  return (
    !holiday().includes("Halloween") &&
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
        use($item`map to a candy-rich block`);
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
      !get("_mapToACandyRichBlockUsed") || holiday().includes("Halloween"),
    outfit: treatOutfit,
    do: (): void => {
      // We do all treat houses in a row as one task for speed reasons
      for (const house of HOUSE_NUMBERS) {
        if (getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?house_l`))) {
          visitUrl(
            `choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`,
          );
        } else if (
          getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?starhouse`))
        ) {
          visitUrl(
            `choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`,
          );
          runChoice(2);
          visitUrl(`place.php?whichplace=town&action=town_trickortreat`);
        }
      }
    },
    limit: { skip: 1 },
    spendsTurn: false,
    combat: new GarboStrategy(Macro.abort()),
  };
}

export function candyMapTasks(): GarboTask[] {
  return [useCandyMapTask(), doCandyTreat()];
}
